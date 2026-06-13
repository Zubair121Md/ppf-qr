-- FarmScan PostgreSQL Schema

CREATE TABLE workers (
  worker_id       TEXT PRIMARY KEY,
  username        TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  preferred_lang  TEXT NOT NULL DEFAULT 'english',
  role            TEXT NOT NULL DEFAULT 'worker',
  is_active       BOOLEAN DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  failed_attempts INTEGER DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
  product_id      TEXT PRIMARY KEY,
  name_english    TEXT NOT NULL,
  name_tamil      TEXT,
  name_malayalam  TEXT,
  name_hindi      TEXT,
  image_url       TEXT,
  category        TEXT,
  unit            TEXT DEFAULT 'kg',
  weight_per_unit NUMERIC DEFAULT 1,
  is_active       BOOLEAN DEFAULT true,
  qr_url          TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
  order_id            TEXT PRIMARY KEY,
  customer_name       TEXT NOT NULL,
  customer_phone      TEXT,
  status              TEXT DEFAULT 'PENDING',
  assigned_worker_id  TEXT REFERENCES workers(worker_id),
  assignment_type     TEXT DEFAULT 'batch',
  lock_token          UUID,
  locked_by           TEXT REFERENCES workers(worker_id),
  locked_at           TIMESTAMPTZ,
  total_weight_kg     NUMERIC DEFAULT 0,
  parent_order_id     TEXT REFERENCES orders(order_id),
  import_batch_id     TEXT,
  source              TEXT DEFAULT 'manual',
  notes               TEXT,
  packed_at           TIMESTAMPTZ,
  packed_by           TEXT REFERENCES workers(worker_id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
  item_id         SERIAL PRIMARY KEY,
  order_id        TEXT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id      TEXT NOT NULL REFERENCES products(product_id),
  quantity        NUMERIC NOT NULL,
  unit            TEXT NOT NULL DEFAULT 'kg',
  is_packed       BOOLEAN DEFAULT false,
  packed_at       TIMESTAMPTZ,
  packed_by       TEXT REFERENCES workers(worker_id),
  scan_count      INTEGER DEFAULT 0
);

CREATE TABLE packing_log (
  log_id          SERIAL PRIMARY KEY,
  order_id        TEXT REFERENCES orders(order_id),
  order_item_id   INTEGER REFERENCES order_items(item_id),
  worker_id       TEXT NOT NULL REFERENCES workers(worker_id),
  product_id      TEXT REFERENCES products(product_id),
  action          TEXT NOT NULL,
  scanned_qr      TEXT,
  expected_qr     TEXT,
  match           BOOLEAN,
  logged_at       TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE qc_errors (
  error_id        SERIAL PRIMARY KEY,
  order_id        TEXT NOT NULL REFERENCES orders(order_id),
  worker_id       TEXT NOT NULL REFERENCES workers(worker_id),
  logged_by       TEXT NOT NULL REFERENCES workers(worker_id),
  error_code      TEXT NOT NULL,
  error_note      TEXT,
  photo_url       TEXT,
  acknowledged_at TIMESTAMPTZ,
  logged_at       TIMESTAMPTZ DEFAULT now(),
  shift_date      DATE DEFAULT CURRENT_DATE
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_worker ON orders(assigned_worker_id);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_packing_log_order ON packing_log(order_id);
CREATE INDEX idx_packing_log_worker ON packing_log(worker_id);
CREATE INDEX idx_qc_errors_worker ON qc_errors(worker_id);
CREATE INDEX idx_qc_errors_unacked ON qc_errors(worker_id) WHERE acknowledged_at IS NULL;

CREATE TABLE IF NOT EXISTS worker_points_ledger (
  id          SERIAL PRIMARY KEY,
  worker_id   TEXT NOT NULL REFERENCES workers(worker_id),
  points      INTEGER NOT NULL,
  reason      TEXT NOT NULL,
  order_id    TEXT REFERENCES orders(order_id),
  ref_type    TEXT,
  ref_id      TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_points_worker ON worker_points_ledger(worker_id);
CREATE INDEX IF NOT EXISTS idx_points_order ON worker_points_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_points_reason ON worker_points_ledger(reason);

-- Security tables (run once on existing databases)
ALTER TABLE workers ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti         TEXT PRIMARY KEY,
  revoked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason      TEXT
);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_time ON revoked_tokens(revoked_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id           SERIAL PRIMARY KEY,
  event_type   TEXT NOT NULL,
  actor_id     TEXT,
  actor_role   TEXT,
  target_type  TEXT,
  target_id    TEXT,
  ip_address   TEXT,
  user_agent   TEXT,
  details      JSONB DEFAULT '{}',
  success      BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_log(target_type, target_id);

-- Row Level Security (for future client-side Supabase calls)
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "worker_read_own" ON workers FOR SELECT
  USING (worker_id = current_setting('app.current_worker_id', true));

CREATE POLICY "worker_read_own_orders" ON orders FOR SELECT
  USING (assigned_worker_id = current_setting('app.current_worker_id', true));

CREATE POLICY "worker_insert_log" ON packing_log FOR INSERT
  WITH CHECK (true);
