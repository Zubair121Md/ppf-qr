# FarmScan — Complete Cursor Build Prompts
### Vercel + Supabase Prototype | Copy-paste each prompt into Cursor Chat (Cmd+L)

---

## HOW TO USE THIS FILE

1. Open Cursor, create a new folder called `farmscan`, open it
2. Open Cursor Chat with `Cmd+L`
3. Paste **Prompt 1** first — wait for it to finish
4. Test it works, then paste **Prompt 2**, and so on
5. Each prompt is self-contained — paste the whole block including context lines

---

---

# PROMPT 1 — PROJECT SCAFFOLD (Paste this first)

```
Create a Next.js 14 app (app router) with Tailwind CSS for a farm packing system called FarmScan.

Deploy target: Vercel + Supabase.

Create this exact folder structure:

/app
  /admin
    /page.jsx              ← Admin dashboard
    /orders/page.jsx       ← Orders list + import
    /products/page.jsx     ← Product manager
    /workers/page.jsx      ← Worker accounts
    /qc/page.jsx           ← QC error log
  /worker
    /page.jsx              ← Worker home (redirects to login or orders)
    /login/page.jsx        ← Worker login
    /orders/page.jsx       ← Worker's assigned orders list
    /pack/[orderId]/page.jsx ← Packing flow for one order
    /scan/page.jsx         ← QR scanner screen
  /api
    /auth/login/route.js
    /auth/me/route.js
    /products/route.js
    /products/[id]/route.js
    /orders/route.js
    /orders/import/route.js
    /orders/distribute/route.js
    /orders/[id]/route.js
    /order-items/[id]/pack/route.js
    /workers/route.js
    /workers/[id]/route.js
    /workers/[id]/feedback/route.js
    /qc-errors/route.js
    /qc-errors/[id]/acknowledge/route.js

/components
  /admin
    OrderImport.jsx
    DistributionTable.jsx
    QCErrorForm.jsx
    WorkerCard.jsx
    LiveDashboard.jsx
  /worker
    FeedbackAlert.jsx
    OrderCard.jsx
    PackingChecklist.jsx
    QRScanner.jsx
    ProductConfirm.jsx
  /shared
    LanguageAudio.jsx

/lib
  db.js           ← Supabase client
  auth.js         ← JWT helpers
  distribute.js   ← LPT bin-packing algorithm
  speech.js       ← Web Speech API wrapper (4 languages)
  constants.js    ← Error codes, language map

Install these packages:
  @supabase/supabase-js
  @supabase/auth-helpers-nextjs
  bcryptjs
  jsonwebtoken
  xlsx
  html5-qrcode
  qrcode

Create .env.local with these placeholders (I will fill in the values):
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  JWT_SECRET=
  NEXT_PUBLIC_APP_URL=

In next.config.js add:
  experimental: { appDir: true }
  and allow images from res.cloudinary.com

Create a README.md explaining the folder structure.
```

---

# PROMPT 2 — SUPABASE DATABASE SCHEMA

```
Create the file /supabase/schema.sql with the complete PostgreSQL schema for FarmScan.

-- ─────────────────────────────────────────
-- WORKERS (10 accounts + admin accounts)
-- ─────────────────────────────────────────
CREATE TABLE workers (
  worker_id       TEXT PRIMARY KEY,           -- e.g. WRK-001, WRK-002
  username        TEXT UNIQUE NOT NULL,        -- e.g. 'l1', 'l2', 'worker1'
  password_hash   TEXT NOT NULL,              -- bcrypt, never store plain
  full_name       TEXT NOT NULL,
  preferred_lang  TEXT NOT NULL DEFAULT 'english', -- tamil/malayalam/hindi/english
  role            TEXT NOT NULL DEFAULT 'worker',  -- worker/admin
  is_active       BOOLEAN DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  failed_attempts INTEGER DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- PRODUCTS (300 products, permanent QR IDs)
-- ─────────────────────────────────────────
CREATE TABLE products (
  product_id      TEXT PRIMARY KEY,           -- e.g. STR-001, BLB-001, RSP-001
  name_english    TEXT NOT NULL,
  name_tamil      TEXT,
  name_malayalam  TEXT,
  name_hindi      TEXT,
  image_url       TEXT,                       -- Cloudinary URL
  category        TEXT,                       -- BERRY/VEG/FRT/GRN/HRB
  unit            TEXT DEFAULT 'kg',          -- kg/piece/bundle/box
  weight_per_unit NUMERIC DEFAULT 1,          -- grams or kg per unit
  is_active       BOOLEAN DEFAULT true,
  qr_url          TEXT,                       -- full scan URL: https://domain.com/p/STR-001
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────
CREATE TABLE orders (
  order_id            TEXT PRIMARY KEY,       -- e.g. ORD-20240615-001
  customer_name       TEXT NOT NULL,
  customer_phone      TEXT,
  status              TEXT DEFAULT 'PENDING', -- PENDING/ASSIGNED/PACKING/PACKED/ERROR
  assigned_worker_id  TEXT REFERENCES workers(worker_id),
  assignment_type     TEXT DEFAULT 'batch',   -- batch/overflow
  lock_token          UUID,                   -- anti-double-pack: set on claim
  locked_by           TEXT REFERENCES workers(worker_id),
  locked_at           TIMESTAMPTZ,
  total_weight_kg     NUMERIC DEFAULT 0,
  parent_order_id     TEXT REFERENCES orders(order_id),  -- for split bulk orders
  import_batch_id     TEXT,
  source              TEXT DEFAULT 'manual',  -- excel/manual
  notes               TEXT,
  packed_at           TIMESTAMPTZ,
  packed_by           TEXT REFERENCES workers(worker_id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- ORDER ITEMS (individual products per order)
-- ─────────────────────────────────────────
CREATE TABLE order_items (
  item_id         SERIAL PRIMARY KEY,
  order_id        TEXT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id      TEXT NOT NULL REFERENCES products(product_id),
  quantity        NUMERIC NOT NULL,
  unit            TEXT NOT NULL DEFAULT 'kg',
  is_packed       BOOLEAN DEFAULT false,
  packed_at       TIMESTAMPTZ,
  packed_by       TEXT REFERENCES workers(worker_id),    -- worker who scanned this item
  scan_count      INTEGER DEFAULT 0                       -- how many times QR was scanned
);

-- ─────────────────────────────────────────
-- PACKING LOG (full audit trail)
-- ─────────────────────────────────────────
CREATE TABLE packing_log (
  log_id          SERIAL PRIMARY KEY,
  order_id        TEXT REFERENCES orders(order_id),
  order_item_id   INTEGER REFERENCES order_items(item_id),
  worker_id       TEXT NOT NULL REFERENCES workers(worker_id),
  product_id      TEXT REFERENCES products(product_id),
  action          TEXT NOT NULL,   -- LOGIN/CLAIM_ORDER/SCAN_CORRECT/SCAN_WRONG/PACK_ITEM/ORDER_COMPLETE
  scanned_qr      TEXT,            -- the actual QR value scanned (for wrong scan debugging)
  expected_qr     TEXT,            -- what was expected
  match           BOOLEAN,         -- true if scanned = expected
  logged_at       TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- WORKER DAILY LOAD (for distribution tracking)
-- ─────────────────────────────────────────
CREATE TABLE worker_daily_load (
  id              SERIAL PRIMARY KEY,
  worker_id       TEXT NOT NULL REFERENCES workers(worker_id),
  load_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  assigned_kg     NUMERIC DEFAULT 0,
  packed_kg       NUMERIC DEFAULT 0,
  order_count     INTEGER DEFAULT 0,
  error_count     INTEGER DEFAULT 0,
  UNIQUE(worker_id, load_date)
);

-- ─────────────────────────────────────────
-- QC ERRORS (admin logs errors after physical inspection)
-- ─────────────────────────────────────────
CREATE TABLE qc_errors (
  error_id        SERIAL PRIMARY KEY,
  order_id        TEXT NOT NULL REFERENCES orders(order_id),
  worker_id       TEXT NOT NULL REFERENCES workers(worker_id),  -- who packed (auto-looked up)
  logged_by       TEXT NOT NULL REFERENCES workers(worker_id),  -- admin who logged it
  error_code      TEXT NOT NULL,   -- ERR-001 through ERR-006 or CUSTOM
  error_note      TEXT,
  photo_url       TEXT,            -- optional photo of the error
  acknowledged_at TIMESTAMPTZ,    -- when worker tapped 'I understand'
  logged_at       TIMESTAMPTZ DEFAULT now(),
  shift_date      DATE DEFAULT CURRENT_DATE
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_worker ON orders(assigned_worker_id);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_packing_log_order ON packing_log(order_id);
CREATE INDEX idx_packing_log_worker ON packing_log(worker_id);
CREATE INDEX idx_qc_errors_worker ON qc_errors(worker_id);
CREATE INDEX idx_qc_errors_unacked ON qc_errors(worker_id) WHERE acknowledged_at IS NULL;

-- ─────────────────────────────────────────
-- SEED DATA — 10 worker accounts (passwords: worker1→pass: 'l1pass' etc, all bcrypt)
-- ─────────────────────────────────────────
-- NOTE: Run this AFTER bcrypt-hashing the passwords in the app.
-- The seed file /supabase/seed.js will do this. Create that file next.

Also create /supabase/seed.js that:
1. Creates 10 worker accounts: usernames l1 through l10
   - l1–l3: preferred_lang = 'tamil'
   - l4–l6: preferred_lang = 'malayalam'  
   - l7–l8: preferred_lang = 'hindi'
   - l9–l10: preferred_lang = 'english'
   - Default password for all: 'farmscan123' (admin changes later)
   - role = 'worker'
2. Creates 1 admin account: username 'admin', password 'admin123', role = 'admin'
3. Creates 5 sample products:
   { product_id: 'STR-001', name_english: 'Strawberry', name_tamil: 'ஸ்ட்ராபெரி',
     name_malayalam: 'സ്ട്രോബെറി', name_hindi: 'स्ट्रॉबेरी', category: 'BERRY', unit: 'kg' }
   { product_id: 'BLB-001', name_english: 'Blueberry', name_tamil: 'ப்ளூபெரி',
     name_malayalam: 'ബ്ലൂബെറി', name_hindi: 'ब्लूबेरी', category: 'BERRY', unit: 'kg' }
   { product_id: 'RSP-001', name_english: 'Raspberry', name_tamil: 'ராஸ்பெரி',
     name_malayalam: 'റാസ്ബെറി', name_hindi: 'रास्पबेरी', category: 'BERRY', unit: 'kg' }
   { product_id: 'MGO-001', name_english: 'Mango', name_tamil: 'மாம்பழம்',
     name_malayalam: 'മാങ്ങ', name_hindi: 'आम', category: 'FRT', unit: 'kg' }
   { product_id: 'TOM-001', name_english: 'Tomato', name_tamil: 'தக்காளி',
     name_malayalam: 'തക്കാളി', name_hindi: 'टमाटर', category: 'VEG', unit: 'kg' }
   
   Also set qr_url = process.env.NEXT_PUBLIC_APP_URL + '/p/' + product_id for each

Run seed.js with: node supabase/seed.js
```

---

# PROMPT 3 — AUTH SYSTEM (Login + JWT + Middleware)

```
Build the complete authentication system for FarmScan.

== /lib/auth.js ==
Export these functions:
  - hashPassword(plain) → bcrypt hash (rounds=10)
  - verifyPassword(plain, hash) → boolean
  - signToken(payload) → JWT string (expires 7d, uses JWT_SECRET)
  - verifyToken(token) → decoded payload or null
  - getWorkerFromRequest(request) → worker object from JWT cookie or null

== /app/api/auth/login/route.js ==
POST handler:
  Body: { username, password }
  Steps:
    1. Find worker by username in Supabase (select all fields)
    2. If not found → 401 { error: 'Invalid username or password' }
    3. Check locked_until: if in future → 401 { error: 'Account locked. Try again later.' }
    4. Verify password with bcrypt
    5. If wrong:
       - Increment failed_attempts
       - If failed_attempts >= 5: set locked_until = now + 30 minutes
       - Return 401 { error: 'Invalid username or password' }
    6. If correct:
       - Reset failed_attempts = 0, locked_until = null
       - Update last_login_at = now()
       - Log to packing_log: action='LOGIN'
       - Sign JWT with { worker_id, username, full_name, role, preferred_lang }
       - Set httpOnly cookie 'farmscan_token' (7 days, sameSite=lax)
       - Return 200 { worker_id, username, full_name, role, preferred_lang }

== /app/api/auth/me/route.js ==
GET handler:
  - Read cookie 'farmscan_token'
  - Verify JWT
  - Return worker info or 401

== /middleware.js ==
  - Routes starting with /admin/* → require role='admin', else redirect to /worker/login
  - Routes starting with /worker/* (except /worker/login) → require any valid token, else redirect to /worker/login
  - /api/admin/* → require role='admin', else 403
  - /api/worker/* → require valid token, else 401
  - Public routes (no auth needed): /worker/login, /p/*, /api/auth/*

== /app/worker/login/page.jsx ==
UI Requirements (IMPORTANT — this is used by farm workers):
  - Full screen, centered, clean
  - FarmScan logo at top (just text, green color #1B5E20)
  - Username field: large (h-14), placeholder 'Username / l1'
  - Password field: large (h-14), show/hide toggle
  - Language selector at bottom: 4 large buttons [தமிழ்] [മലയ] [हिं] [EN]
    - Selecting a language saves it to localStorage key 'farmscan_lang'
    - Also shows the login button label in that language:
      tamil: 'உள்நுழை', malayalam: 'ലോഗിൻ', hindi: 'लॉगिन', english: 'Login'
  - On submit: POST /api/auth/login
  - On success:
    - If role='admin' → redirect to /admin
    - If role='worker' → redirect to /worker/orders
  - Error shown in red below the form
  - No registration link (accounts are admin-created only)
```

---

# PROMPT 4 — SPEECH LIBRARY (4 Languages, Audio Feedback)

```
Create /lib/speech.js — the complete audio system for FarmScan.

This file runs CLIENT-SIDE only (browser). Add 'use client' is NOT needed in the lib file itself — the components that import it will be client components.

== LANGUAGE CONFIG ==
const LANG_CODES = {
  english:   'en-IN',
  tamil:     'ta-IN',
  malayalam: 'ml-IN',
  hindi:     'hi-IN',
}

== MESSAGES IN ALL 4 LANGUAGES ==
Build a MESSAGES object with these keys, each having english/tamil/malayalam/hindi:

'scan_correct':
  english:   'Correct. {product} confirmed.'
  tamil:     'சரி. {product} உறுதிப்படுத்தப்பட்டது.'
  malayalam: 'ശരി. {product} സ്ഥിരീകരിച്ചു.'
  hindi:     'सही है। {product} पुष्टि हुई।'

'scan_wrong':
  english:   'Wrong product. Please scan {product}.'
  tamil:     'தவறான பொருள். {product} ஸ்கேன் செய்யவும்.'
  malayalam: 'തെറ്റായ ഉൽപ്പന്നം. {product} സ്കാൻ ചെയ്യുക.'
  hindi:     'गलत उत्पाद। कृपया {product} स्कैन करें।'

'order_complete':
  english:   'Order complete. Well done.'
  tamil:     'ஆர்டர் முடிந்தது. நன்றாக செய்தீர்கள்.'
  malayalam: 'ഓർഡർ പൂർത്തിയായി. നന്നായി ചെയ്തു.'
  hindi:     'ऑर्डर पूरा हुआ। शाबाश।'

'feedback_error':
  english:   'You have a feedback message from your supervisor.'
  tamil:     'உங்கள் மேற்பார்வையாளரிடமிருந்து ஒரு கருத்து உள்ளது.'
  malayalam: 'നിങ്ങളുടെ സൂപ്പർവൈസറിൽ നിന്ന് ഒരു ഫീഡ്ബാക്ക് ഉണ്ട്.'
  hindi:     'आपके सुपरवाइज़र का एक फ़ीडबैक संदेश है।'

'error_wrong_product':    'Wrong product was packed'  (all 4 langs)
'error_wrong_qty':        'Wrong quantity packed'     (all 4 langs)
'error_damaged':          'Damaged item was packed'   (all 4 langs)
'error_missing_item':     'Item was missing'          (all 4 langs)
'error_wrong_label':      'Wrong label used'          (all 4 langs)
'error_packaging':        'Packaging issue'           (all 4 langs)

== EXPORTS ==

export function speak(text, lang = 'english', rate = 0.85) {
  // Cancel any ongoing speech
  // Create SpeechSynthesisUtterance
  // Set lang from LANG_CODES
  // Set rate, volume=1
  // speak
  // Return the utterance (so caller can add event listeners)
}

export function speakMessage(key, lang = 'english', replacements = {}) {
  // Get message from MESSAGES[key][lang] or fallback to english
  // Replace {product} etc from replacements object
  // Call speak()
}

export function speakProductName(product, lang = 'english') {
  // product has name_english, name_tamil, name_malayalam, name_hindi
  // Pick the right name field based on lang
  // Fallback to name_english if that lang's name is empty
  // Call speak()
}

export function getWorkerLang() {
  // Read from localStorage key 'farmscan_lang'
  // Default to 'english'
  // Only call this in client components (check typeof window !== 'undefined')
}

export const LANG_LABELS = {
  english:   { button: 'EN', native: 'English' },
  tamil:     { button: 'தமிழ்', native: 'Tamil' },
  malayalam: { button: 'മലയ', native: 'Malayalam' },
  hindi:     { button: 'हिं', native: 'Hindi' },
}
```

---

# PROMPT 5 — PRODUCT QR SYSTEM (Master QR IDs like STR-001)

```
Build the product QR system. Each product has a permanent Master QR ID (e.g. STR-001, BLB-001).

== QR URL FORMAT ==
The QR code encodes this URL:  https://[APP_URL]/p/[product_id]
Example: https://farmscan.vercel.app/p/STR-001

This URL NEVER changes. Product data behind it can be updated anytime.

== /app/p/[productId]/page.jsx ==
This is the public product page (no auth needed) — used by QR scanner redirect.
  - Server component
  - Fetch product from Supabase by productId
  - If not found: show 'Product not found'
  - If found: show product name (English), image, product_id
  - This page is NOT the packing confirmation page — it's just the data endpoint
  - The worker app scanner reads the URL from QR and extracts the product_id, then calls the API

== /app/api/products/route.js ==
GET: 
  - Query param: ?ids=true → returns just array of all product_ids (for import validation)
  - Otherwise: returns all active products (id, names, image_url, category, unit)
  
POST (admin only):
  - Body: { product_id, name_english, name_tamil, name_malayalam, name_hindi, image_url, category, unit }
  - Validate: product_id must match pattern /^[A-Z]{2,6}-\d{3}$/ (e.g. STR-001, BERRY-001)
  - Insert into products
  - Generate qr_url = NEXT_PUBLIC_APP_URL + '/p/' + product_id
  - Return created product

== /app/api/products/[id]/route.js ==
GET: Return single product with all fields
PATCH (admin only): Update any fields EXCEPT product_id
DELETE (admin only): Set is_active = false (never hard delete)

== /app/admin/products/page.jsx ==
Admin product manager:
  - Table of all products: product_id | name_english | category | QR | status
  - 'Add Product' button → modal form
  - product_id field with hint: 'Use format like STR-001, BLB-001, TOM-001'
  - For each product: 'Download QR' button → generates QR code PNG using qrcode library
    QR encodes: process.env.NEXT_PUBLIC_APP_URL + '/p/' + product_id
    QR specs: error correction level H, size 300x300px, black on white
  - 'Print All QR' button → opens printable page with all product QR codes, 
    4 per row, each showing: QR image + product_id + name_english underneath
    Label size: 6cm × 6cm equivalent in the print layout
  - Language completeness: show count of products missing tamil/malayalam/hindi names
    Click to filter and fix them
```

---

# PROMPT 6 — ORDER IMPORT + AUTO DISTRIBUTION

```
Build the complete order import and auto-distribution system.

== /lib/distribute.js ==
Export function: distributeOrders(orders, workers)

Input:
  orders  = [{ order_id, total_weight_kg }]
  workers = [{ worker_id }]  ← only active workers

Algorithm (Longest Processing Time bin-packing):
  1. Filter out orders with total_weight_kg > 150 → these get SPLIT (see step 5)
  2. Sort remaining orders descending by total_weight_kg
  3. Init workerLoads = { [worker_id]: 0 } for all workers
  4. For each order:
     → Find worker_id with minimum current load in workerLoads
     → Assign order to that worker
     → Add order weight to workerLoads[worker_id]
  5. For orders > 150 kg (SPLIT orders):
     → Create two entries: order_id + '-A' and order_id + '-B'
     → Each gets half the weight
     → Assign to two different workers (the two with lowest loads)
     → Flag them with parent_order_id = original order_id
  6. Orders with total_weight_kg < 3 kg → assignment_type = 'overflow', assigned_worker_id = null
  7. Return array of { order_id, assigned_worker_id, assignment_type }

Also export: calculateTotalWeightFromItems(items, products)
  → items = [{ product_id, quantity, unit }]
  → products = products map
  → Returns total kg (converts pieces to kg using product.weight_per_unit if unit != kg)

== /app/api/orders/import/route.js ==
POST (admin only):
  Body: {
    batch_id: string,
    orders: [{ order_id, customer_name, customer_phone, items: [{ product_id, quantity, unit }], notes }]
  }
  Steps:
    1. Validate all product_ids exist (fetch all product ids from DB once)
    2. Check for duplicate order_ids (already in DB)
    3. Calculate total_weight_kg per order using calculateTotalWeightFromItems
    4. Insert all valid orders + order_items in a Supabase transaction (use Promise.all)
    5. After insert, automatically call distributeOrders()
    6. Bulk update orders with assigned_worker_id + assignment_type
    7. Upsert worker_daily_load for today
    8. Return { imported: N, errors: [...], distribution: [{ worker_id, full_name, order_count, total_kg }] }

== /app/api/orders/distribute/route.js ==
POST (admin only):
  Re-runs distribution for all PENDING/ASSIGNED orders today
  Useful if admin wants to re-balance after adding more orders

== /components/admin/OrderImport.jsx ==
'use client'

UI:
  1. Two tabs: 'Upload Excel' | 'Manual Entry'
  
  EXCEL TAB:
    - Drag and drop zone (accept .xlsx, .xls)
    - On file drop: use SheetJS to parse in browser
    - Expected columns: order_id, customer_name, customer_phone, product_id, quantity, unit, notes
    - Group rows by order_id → create orders with items[]
    - Call GET /api/products?ids=true to get valid product ids
    - Validate each row
    - Show preview table: columns = order_id | customer | items | total rows | status (green/red)
    - Red rows show error reason in the status column
    - Summary line: '42 orders ready to import, 3 errors'
    - 'Download error rows' button (generates new xlsx with just error rows + reason column)
    - 'Confirm Import' button → POST /api/orders/import
    - After success: show distribution result table (worker | orders | kg)
  
  MANUAL TAB:
    - Form: customer_name (required), customer_phone (optional), notes (optional)
    - Product search: type product name or ID → autocomplete from products list
    - Add product line: product | quantity | unit
    - Can add multiple product lines
    - Submit → POST /api/orders (single order)
    - After submit: show which worker it was assigned to
```

---

# PROMPT 7 — WORKER PACKING FLOW (THE CORE FEATURE)

```
Build the complete worker packing flow. This is the most important feature.

THE FULL FLOW:
Worker sees order → taps a product → audio plays → QR scanner opens → 
scans crate QR → if correct: confirms + audio → if wrong: error audio + retry →
when all items done: order marked packed with worker's ID

== /app/worker/orders/page.jsx ==
'use client' — Protected (worker role)

  1. On load: fetch GET /api/orders?worker=me&date=today
  2. Show list of orders assigned to logged-in worker
  3. Each order card shows:
     - Customer name
     - Item count + total kg
     - Status badge (PENDING/PACKING/PACKED)
     - List of products inside (e.g. '50kg Strawberry, 50kg Blueberry, 50kg Raspberry')
  4. On load, also check GET /api/workers/[id]/feedback for unread QC errors
     → If any unread: show <FeedbackAlert> modal FIRST before orders list
  5. Tap any PENDING or PACKING order → navigate to /worker/pack/[orderId]
  6. Overflow pool section at bottom: 'Available orders' (assignment_type='overflow')
     → Tap to claim → PATCH /api/orders/[id]/claim (sets lock_token)

== /app/worker/pack/[orderId]/page.jsx ==
'use client' — The main packing screen

On load:
  1. Fetch order details: GET /api/orders/[orderId]
  2. Fetch order items with product details joined
  3. If order.assigned_worker_id != current worker → show 'This order is not yours'
  4. If order has no lock_token: call PATCH /api/orders/[orderId]/claim to lock it
  5. Get worker's preferred_lang from localStorage 'farmscan_lang'

Layout — MOBILE FIRST, large touch targets:
  - Top bar: order ID + customer name + kg total
  - Progress: 'X of Y items packed' with progress bar
  - Item list: each item is a large card (min 80px tall)

Each item card shows:
  - Product image (60×60px thumbnail, from image_url)
  - Product name IN WORKER'S LANGUAGE (large, min 24px font)
  - Quantity needed: e.g. '50 kg'
  - Status: grey circle = unpacked, green checkmark = packed

IMPORTANT — TAP BEHAVIOUR ON ITEM CARD:
  When worker taps an item card:
  1. Show the product detail panel (slides up from bottom, full-width)
  2. Panel shows:
     - Product image (large, full width)
     - Product name in worker's language (very large text, 32px+)
     - Quantity: '50 kg'
     - IMMEDIATELY auto-play audio: speakProductName(product, workerLang)
       (Tamil worker hears 'ஸ்ட்ராபெரி', Malayalam worker hears 'സ്ട്രോബെറി', etc.)
  3. Below the product info: big green 'SCAN QR' button
  4. Worker presses SCAN QR → navigate to /worker/scan?itemId=[item_id]&orderId=[orderId]

== /app/worker/scan/page.jsx ==
'use client' — QR scanner screen

Read URL params: itemId, orderId
Fetch the expected item and product from API.

  1. Show expected product at top: image + name in worker's language
     Auto-play: speakProductName(expectedProduct, workerLang)  ← plays when screen opens
  2. Camera scanner below using html5-qrcode:
     Config: { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }
  3. On successful QR scan:
     
     EXTRACT product_id from scanned URL:
       scanned = 'https://farmscan.vercel.app/p/STR-001'
       scannedProductId = scanned.split('/p/')[1]  → 'STR-001'
     
     COMPARE with expected:
       expectedProductId = item.product_id  → e.g. 'STR-001'
     
     IF scannedProductId === expectedProductId:
       ─ Flash GREEN overlay on screen
       ─ speakMessage('scan_correct', workerLang, { product: productName })
         Worker hears: 'சரி. ஸ்ட்ராபெரி உறுதிப்படுத்தப்பட்டது.' (if Tamil)
       ─ Log to packing_log: action='SCAN_CORRECT', match=true
       ─ PATCH /api/order-items/[itemId]/pack
       ─ Navigate back to /worker/pack/[orderId]
     
     IF scannedProductId !== expectedProductId:
       ─ Flash RED overlay on screen
       ─ speakMessage('scan_wrong', workerLang, { product: expectedProductName })
         Worker hears: 'தவறான பொருள். ஸ்ட்ராபெரி ஸ்கேன் செய்யவும்.' (if Tamil)
       ─ Log to packing_log: action='SCAN_WRONG', match=false, scanned_qr=scannedValue
       ─ Show error message on screen in worker's language: 
         'Wrong product scanned. Please find and scan: [product name in their lang]'
       ─ Scanner stays open for retry — do NOT navigate away
       ─ After 3 wrong scans on same item: show 'Call your supervisor' message
  
  4. Back button: returns to /worker/pack/[orderId] without marking item packed

== /app/api/order-items/[id]/pack/route.js ==
PATCH (worker auth):
  - Mark item is_packed = true, packed_at = now(), packed_by = current worker_id
  - Increment order_items.scan_count
  - Log to packing_log: action='PACK_ITEM', worker_id, order_id, product_id
  - Check if ALL items in this order are now packed
    → If yes: update order status = 'PACKED', packed_at = now(), packed_by = current worker_id
    → Log to packing_log: action='ORDER_COMPLETE'
  - Return { item, orderComplete: true/false }

== /app/api/orders/[id]/claim/route.js ==
PATCH (worker auth):
  UPDATE orders SET 
    lock_token = gen_random_uuid(),
    locked_by = current_worker_id,
    locked_at = now(),
    status = 'PACKING'
  WHERE order_id = ? AND (lock_token IS NULL OR locked_by = current_worker_id)
  
  If 0 rows updated → return 409 { error: 'Order already claimed by another worker' }
  Return updated order

== ORDER COMPLETE SCREEN ==
When orderComplete = true returned from pack API, show full-screen success:
  - Large green checkmark
  - 'Order Complete!' in worker's language
  - Order ID + customer name
  - 'Packed by: [worker full_name]' — this is the permanent record
  - Auto-play: speakMessage('order_complete', workerLang)
  - 'Back to My Orders' button
```

---

# PROMPT 8 — QC FEEDBACK SYSTEM

```
Build the complete QC feedback system: admin logs errors, worker sees them on login.

== /app/api/qc-errors/route.js ==
POST (admin only):
  Body: { order_id, error_code, error_note, photo_url? }
  Steps:
    1. Look up the order → get packed_by worker_id (this is who made the error)
    2. If order status != 'PACKED' → 400 { error: 'Can only log errors on packed orders' }
    3. Insert into qc_errors with worker_id = order.packed_by
    4. Update order status = 'ERROR'
    5. Increment worker_daily_load.error_count for the shift_date
    6. Return created error

GET (admin only):
  Query params: ?worker_id=&date=&unacked_only=
  Returns list of qc_errors joined with worker name + order details

== /app/api/workers/[id]/feedback/route.js ==
GET (worker — own ID only):
  Returns all qc_errors for this worker where acknowledged_at IS NULL
  Joined with order details and product names

== /app/api/qc-errors/[id]/acknowledge/route.js ==
PATCH (worker — must be the worker the error belongs to):
  SET acknowledged_at = now()
  Return updated error

== /components/worker/FeedbackAlert.jsx ==
'use client'

Props: { errors: QCError[], onAllAcknowledged: () => void }

Show as a full-screen modal overlay (z-index: 9999) with red background tint.

For each error (show one at a time, paginated):
  
  Header: ⚠️ 'Feedback from supervisor' (in worker's language)
  
  Details card:
    - 'Order: [order_id]'  
    - 'Packed on: [packed_at formatted date]' 
    - Error type in their language (map error_code to MESSAGES['error_' + code][lang])
    - Admin's note (shown as-is)
    - Photo if exists (tap to enlarge)
  
  ON MOUNT: auto-play audio:
    speakMessage('feedback_error', workerLang)
    then after 2 seconds: speakMessage('error_' + error.error_code, workerLang)
  
  Bottom: single large button 'I understand' (in worker's language):
    tamil: 'புரிந்தது'  
    malayalam: 'മനസ്സിലായി'
    hindi: 'समझ गया'
    english: 'I understand'
  
  On tap: PATCH /api/qc-errors/[id]/acknowledge
    If more errors: show next one
    If last error: call onAllAcknowledged() → modal closes, worker sees orders

== /app/admin/qc/page.jsx ==
Admin QC error log page:
  
  TOP STATS ROW (last 30 days):
    - Total errors | Most errors: [worker name] | Best accuracy: [worker name]
  
  WORKER ACCURACY TABLE:
    Columns: Worker | Orders (30d) | Errors | Accuracy % | Last Error | Actions
    - Accuracy = (orders - errors) / orders * 100
    - Row turns red if accuracy < 95%
    - 'View Errors' button per worker
  
  ERROR LOG TABLE (filterable):
    Filters: Worker dropdown | Date range | Error code | Acknowledged yes/no
    Columns: Date | Order ID | Worker | Error Type | Note | Acknowledged
    - Click any row → expand to show full details + photo
  
  LOG NEW ERROR button → opens QCErrorForm modal

== /components/admin/QCErrorForm.jsx ==
'use client'

Props: { orderId?: string, onSuccess: () => void }

If orderId provided: pre-fill and show order details
Else: order search field (search by order ID or customer name)

Fields:
  - Order ID (required, with lookup showing customer name + packed_by worker name)
  - Error code dropdown:
      ERR-001: Wrong product packed
      ERR-002: Wrong quantity
      ERR-003: Damaged / poor quality item
      ERR-004: Missing item
      ERR-005: Wrong label / wrong bag
      ERR-006: Packaging issue
      CUSTOM: Other (show free text)
  - Error note (textarea, required)
  - Photo upload (optional, upload to /api/upload → Cloudinary or Supabase storage)

Submit → POST /api/qc-errors
Show success: 'Error logged. Worker will be notified on next login.'
```

---

# PROMPT 9 — ADMIN LIVE DASHBOARD

```
Build the admin live dashboard at /app/admin/page.jsx

'use client' — uses Supabase realtime subscription

== LAYOUT ==

TOP STATS BAR (4 cards in a row):
  - Today's Total: [N] orders | [X] kg
  - Packed: [N] orders | green
  - In Progress: [N] orders | yellow  
  - Pending: [N] orders | grey

WORKER GRID (2 rows × 5 cols = 10 workers):
  Each worker card:
  - Worker full name (bold)
  - Username badge (e.g. 'l1') in top right
  - Preferred language flag emoji: 🇮🇳 (all Indian languages — just show lang name)
  - Current status:
      IDLE: grey, shows 'No active order'
      PACKING: yellow, shows 'Packing ORD-XXX (Xkg)'
      DONE: green, shows 'Done — X orders packed today'
  - Today's progress: 'X/Y kg packed' with mini progress bar
  - Error badge: red circle with number if errors this week > 0

REALTIME: Subscribe to Supabase channel 'orders' for UPDATE events
  → When any order status changes: re-fetch worker stats and update cards

DISTRIBUTION PANEL (shown after today's import):
  Table: Worker | Assigned Orders | Assigned kg | Packed | Remaining
  'Re-distribute' button (admin can re-run distribution if needed)
  'Manual Override' link → goes to /admin/orders with drag-assign UI

RECENT ACTIVITY FEED (right sidebar, last 20 log entries):
  Fetched from packing_log joined with worker name + product name
  Format: '[worker name] packed [product name] for [order_id] — [time ago]'
  Or: '[worker name] logged in — [time ago]'
  Refresh every 30 seconds (or Supabase realtime on packing_log table)

QUICK ACTIONS:
  - 'Import Orders' → opens /admin/orders with import tab active
  - 'Log QC Error' → opens QCErrorForm modal
  - 'View Full Report' → /admin/qc
```

---

# PROMPT 10 — VERCEL + SUPABASE DEPLOYMENT CONFIG

```
Set up the project for Vercel + Supabase deployment.

== vercel.json ==
Create vercel.json:
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_key",
    "JWT_SECRET": "@jwt_secret",
    "NEXT_PUBLIC_APP_URL": "@app_url"
  }
}

== /lib/db.js ==
Create TWO Supabase clients:

1. Client-side client (uses anon key, safe to expose):
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

2. Server-side admin client (uses service role key, API routes only):
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

Export both. Use supabaseAdmin in all /app/api/ routes.
Use supabase in client components only for read operations.

== /lib/constants.js ==
export const ERROR_CODES = {
  'ERR-001': { label: 'Wrong product packed', messageKey: 'error_wrong_product' },
  'ERR-002': { label: 'Wrong quantity',        messageKey: 'error_wrong_qty' },
  'ERR-003': { label: 'Damaged item',          messageKey: 'error_damaged' },
  'ERR-004': { label: 'Missing item',          messageKey: 'error_missing_item' },
  'ERR-005': { label: 'Wrong label / bag',     messageKey: 'error_wrong_label' },
  'ERR-006': { label: 'Packaging issue',       messageKey: 'error_packaging' },
  'CUSTOM':  { label: 'Other',                 messageKey: null },
}

export const LANGUAGES = ['english', 'tamil', 'malayalam', 'hindi']

export const ORDER_STATUSES = ['PENDING', 'ASSIGNED', 'PACKING', 'PACKED', 'ERROR']

export const WEIGHT_SPLIT_THRESHOLD_KG = 150  // orders above this get split
export const OVERFLOW_THRESHOLD_KG = 3         // orders below this go to overflow pool
export const ACCURACY_ALERT_THRESHOLD = 0.95   // below 95% = flagged red

== Supabase Row Level Security (RLS) — add to schema.sql ==
-- Enable RLS on all tables
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_errors ENABLE ROW LEVEL SECURITY;

-- NOTE: For this prototype, use service role key in API routes (bypasses RLS).
-- RLS policies below are for future client-side Supabase calls:

-- Workers can read their own record
CREATE POLICY "worker_read_own" ON workers FOR SELECT
  USING (worker_id = current_setting('app.current_worker_id', true));

-- Workers can only see their assigned orders
CREATE POLICY "worker_read_own_orders" ON orders FOR SELECT
  USING (assigned_worker_id = current_setting('app.current_worker_id', true));

-- All authenticated can insert to packing_log
CREATE POLICY "worker_insert_log" ON packing_log FOR INSERT
  WITH CHECK (true);

== PWA CONFIG ==
Create /public/manifest.json:
{
  "name": "FarmScan",
  "short_name": "FarmScan",
  "start_url": "/worker",
  "display": "standalone",
  "background_color": "#1B5E20",
  "theme_color": "#1B5E20",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}

Add to /app/layout.jsx:
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#1B5E20" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />

Create placeholder icons: 192×192 and 512×512 green square PNGs with 'FS' text.

== DEPLOYMENT STEPS (add to README.md) ==
1. Push to GitHub
2. Go to vercel.com → New Project → import your GitHub repo
3. Add environment variables in Vercel dashboard:
   NEXT_PUBLIC_SUPABASE_URL      → from Supabase project settings
   NEXT_PUBLIC_SUPABASE_ANON_KEY → from Supabase project settings  
   SUPABASE_SERVICE_ROLE_KEY     → from Supabase project settings (keep secret)
   JWT_SECRET                    → any random 32+ char string
   NEXT_PUBLIC_APP_URL           → https://your-project.vercel.app
4. In Supabase: run /supabase/schema.sql in SQL editor
5. Run: node supabase/seed.js  (creates worker accounts + sample products)
6. Deploy on Vercel → your app is live
```

---

# QUICK REFERENCE — What Each Worker Account Does

| Username | Lang    | What they see on login |
|----------|---------|------------------------|
| l1       | Tamil   | Orders in Tamil, audio in Tamil |
| l2       | Tamil   | Orders in Tamil, audio in Tamil |
| l3       | Tamil   | Orders in Tamil, audio in Tamil |
| l4       | Malayalam | Orders in Malayalam, audio in Malayalam |
| l5       | Malayalam | Orders in Malayalam, audio in Malayalam |
| l6       | Malayalam | Orders in Malayalam, audio in Malayalam |
| l7       | Hindi   | Orders in Hindi, audio in Hindi |
| l8       | Hindi   | Orders in Hindi, audio in Hindi |
| l9       | English | Orders in English, audio in English |
| l10      | English | Orders in English, audio in English |
| admin    | English | Full admin panel |

---

# QUICK REFERENCE — Master QR ID Format

| Product       | Master QR ID | QR encodes |
|---------------|-------------|------------|
| Strawberry    | STR-001     | https://app.vercel.app/p/STR-001 |
| Blueberry     | BLB-001     | https://app.vercel.app/p/BLB-001 |
| Raspberry     | RSP-001     | https://app.vercel.app/p/RSP-001 |
| Mango         | MGO-001     | https://app.vercel.app/p/MGO-001 |
| Tomato        | TOM-001     | https://app.vercel.app/p/TOM-001 |
| Berry (mix)   | BRY-001     | https://app.vercel.app/p/BRY-001 |

Format rule: 2–4 letter category code + hyphen + 3-digit number. Set once, never change.

---

# EXACT SCAN FLOW — FOR EXAMPLE ORDER (50kg Strawberry + 50kg Blueberry + 50kg Raspberry)

```
Admin creates order ORD-001: 
  Item 1: STR-001, 50 kg
  Item 2: BLB-001, 50 kg  
  Item 3: RSP-001, 50 kg
  Total: 150 kg → auto-assigned to worker l1 (Tamil)

Worker l1 logs in → sees ORD-001 in their list:
  "Ravi Stores — 3 items — 150 kg"
  
Worker taps ORD-001 → sees item list:
  [ ] ஸ்ட்ராபெரி     50 kg  (Strawberry in Tamil)
  [ ] ப்ளூபெரி       50 kg  (Blueberry in Tamil)
  [ ] ராஸ்பெரி       50 kg  (Raspberry in Tamil)

Worker taps first item (ஸ்ட்ராபெரி):
  → Panel slides up: big photo of strawberry, large text 'ஸ்ட்ராபெரி', '50 kg'
  → Audio plays automatically: 'ஸ்ட்ராபெரி' (Tamil TTS)
  → Worker presses SCAN QR button

Scanner opens showing: 'Scan QR on the STRAWBERRY crate' (in Tamil)
  → Worker points phone at the STR-001 QR label on the strawberry crate

IF CORRECT (scanned STR-001, expected STR-001):
  → Green flash on screen
  → Audio: 'சரி. ஸ்ட்ராபெரி உறுதிப்படுத்தப்பட்டது.'
  → Item gets green checkmark ✓
  → logged: worker_id=WRK-L1, action=SCAN_CORRECT, product_id=STR-001

IF WRONG (e.g. scanned RSP-001 instead of STR-001):
  → Red flash on screen
  → Audio: 'தவறான பொருள். ஸ்ட்ராபெரி ஸ்கேன் செய்யவும்.'
  → Screen shows: 'Wrong product. Please scan: ஸ்ட்ராபெரி'
  → Scanner stays open, worker tries again
  → logged: worker_id=WRK-L1, action=SCAN_WRONG, scanned=RSP-001, expected=STR-001

Worker repeats for BLB-001 and RSP-001.

After all 3 items packed:
  → Full screen green: 'ஆர்டர் முடிந்தது. நன்றாக செய்தீர்கள்.'
  → Order marked PACKED, packed_by = WRK-L1

Admin does physical QC check later. Finds raspberry was damaged.
  → Admin panel → ORD-001 → Log QC Error → ERR-003 (Damaged item) → 'Raspberry bruised'
  → Error saved: worker_id = WRK-L1

Worker l1 logs in next day:
  → Full screen red notice: ⚠️ Feedback
  → Audio: 'உங்கள் மேற்பார்வையாளரிடமிருந்து ஒரு கருத்து உள்ளது.'
  → Then: 'கெட்டுப்போன பொருள் பேக் செய்யப்பட்டது' (Damaged item - Tamil)
  → Note shown: 'Raspberry bruised'
  → Worker taps 'புரிந்தது' → acknowledged, can proceed to work
```
