/**
 * Seeds workers, products, AND full demo dataset for end-to-end testing.
 * Run: npm run seed:demo
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TODAY = new Date().toISOString().split('T')[0];
const NOW = new Date().toISOString();

const WORKERS = [
  { worker_id: 'WRK-001', username: 'l1', full_name: 'Ravi Kumar', preferred_lang: 'tamil' },
  { worker_id: 'WRK-002', username: 'l2', full_name: 'Senthil M', preferred_lang: 'tamil' },
  { worker_id: 'WRK-003', username: 'l3', full_name: 'Priya Devi', preferred_lang: 'tamil' },
  { worker_id: 'WRK-004', username: 'l4', full_name: 'Anoop Nair', preferred_lang: 'malayalam' },
  { worker_id: 'WRK-005', username: 'l5', full_name: 'Lakshmi P', preferred_lang: 'malayalam' },
  { worker_id: 'WRK-006', username: 'l6', full_name: 'Suresh Babu', preferred_lang: 'malayalam' },
  { worker_id: 'WRK-007', username: 'l7', full_name: 'Amit Sharma', preferred_lang: 'hindi' },
  { worker_id: 'WRK-008', username: 'l8', full_name: 'Neha Singh', preferred_lang: 'hindi' },
  { worker_id: 'WRK-009', username: 'l9', full_name: 'John Thomas', preferred_lang: 'english' },
  { worker_id: 'WRK-010', username: 'l10', full_name: 'Sarah George', preferred_lang: 'english' },
];

const PRODUCTS = [
  { product_id: 'STR-001', name_english: 'Strawberry', name_tamil: 'ஸ்ட்ராபெரி', name_malayalam: 'സ്ട്രോബെറി', name_hindi: 'स्ट्रॉबेरी', category: 'BERRY', unit: 'kg' },
  { product_id: 'BLB-001', name_english: 'Blueberry', name_tamil: 'ப்ளூபெரி', name_malayalam: 'ബ്ലൂബെറി', name_hindi: 'ब्लूबेरी', category: 'BERRY', unit: 'kg' },
  { product_id: 'RSP-001', name_english: 'Raspberry', name_tamil: 'ராஸ்பெரி', name_malayalam: 'റാസ്ബെറി', name_hindi: 'रास्पबेरी', category: 'BERRY', unit: 'kg' },
  { product_id: 'MGO-001', name_english: 'Mango', name_tamil: 'மாம்பழம்', name_malayalam: 'മാങ്ങ', name_hindi: 'आम', category: 'FRT', unit: 'kg' },
  { product_id: 'TOM-001', name_english: 'Tomato', name_tamil: 'தக்காளி', name_malayalam: 'തക്കാളി', name_hindi: 'टमाटर', category: 'VEG', unit: 'kg' },
  { product_id: 'BRY-001', name_english: 'Mixed Berries', name_tamil: 'கலவை பெர்ரி', name_malayalam: 'മിശ്ര ബെറി', name_hindi: 'मिक्स बेरी', category: 'BERRY', unit: 'kg' },
  { product_id: 'CAR-001', name_english: 'Carrot', name_tamil: 'கேரட்', name_malayalam: 'കാരറ്റ്', name_hindi: 'गाजर', category: 'VEG', unit: 'kg' },
  { product_id: 'APL-001', name_english: 'Apple', name_tamil: 'ஆப்பிள்', name_malayalam: 'ആപ്പിൾ', name_hindi: 'सेब', category: 'FRT', unit: 'kg' },
];

const DEMO_ORDER_IDS = [
  'ORD-DEMO-001', 'ORD-DEMO-002', 'ORD-DEMO-003', 'ORD-DEMO-004',
  'ORD-DEMO-005', 'ORD-DEMO-006', 'ORD-DEMO-007',
];

async function cleanupDemo() {
  console.log('Cleaning old demo data...');
  await supabase.from('qc_errors').delete().in('order_id', DEMO_ORDER_IDS);
  await supabase.from('packing_log').delete().in('order_id', DEMO_ORDER_IDS);
  await supabase.from('order_items').delete().in('order_id', DEMO_ORDER_IDS);
  await supabase.from('orders').delete().in('order_id', DEMO_ORDER_IDS);
}

async function seedAccounts() {
  const workerPassword = await bcrypt.hash('farmscan123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  console.log('Seeding workers...');
  for (const w of WORKERS) {
    await supabase.from('workers').upsert({ ...w, password_hash: workerPassword, role: 'worker', is_active: true });
    console.log(`  ✓ ${w.username} (${w.full_name})`);
  }

  const { data: legacyAdmin } = await supabase
    .from('workers')
    .select('worker_id')
    .eq('worker_id', 'WRK-ADMIN')
    .maybeSingle();

  if (legacyAdmin) {
    await supabase.from('workers').update({
      username: 'manager',
      password_hash: managerPassword,
      full_name: 'Floor Manager',
      preferred_lang: 'english',
      role: 'manager',
      is_active: true,
    }).eq('worker_id', 'WRK-ADMIN');
    console.log('  ✓ manager (migrated from legacy admin account)');
  } else {
    await supabase.from('workers').upsert({
      worker_id: 'WRK-MGR',
      username: 'manager',
      password_hash: managerPassword,
      full_name: 'Floor Manager',
      preferred_lang: 'english',
      role: 'manager',
      is_active: true,
    });
    console.log('  ✓ manager (Floor Manager)');
  }

  await supabase.from('workers').upsert({
    worker_id: 'WRK-ADM',
    username: 'admin',
    password_hash: adminPassword,
    full_name: 'System Admin',
    preferred_lang: 'english',
    role: 'admin',
    is_active: true,
  });
  console.log('  ✓ admin (System Admin)');

  console.log('Seeding products...');
  for (const p of PRODUCTS) {
    await supabase.from('products').upsert({
      ...p,
      qr_url: `${APP_URL}/p/${p.product_id}`,
      is_active: true,
    });
    console.log(`  ✓ ${p.product_id} — ${p.name_english}`);
  }
}

async function insertOrder(order, items) {
  const { error } = await supabase.from('orders').insert(order);
  if (error) throw new Error(`Order ${order.order_id}: ${error.message}`);

  const rows = items.map((item) => ({ ...item, order_id: order.order_id }));
  const { error: itemsError } = await supabase.from('order_items').insert(rows);
  if (itemsError) throw new Error(`Items ${order.order_id}: ${itemsError.message}`);
}

async function seedDemoOrders() {
  console.log('Seeding demo orders...');

  // 1) Main packing test for l1 — 150kg berry order (ASSIGNED)
  await insertOrder(
    {
      order_id: 'ORD-DEMO-001',
      customer_name: 'Ravi Stores',
      customer_phone: '9876543210',
      status: 'ASSIGNED',
      assigned_worker_id: 'WRK-001',
      assignment_type: 'batch',
      total_weight_kg: 150,
      source: 'manual',
      notes: 'Demo: main packing flow — scan STR, BLB, RSP',
      created_at: NOW,
    },
    [
      { product_id: 'STR-001', quantity: 50, unit: 'kg', is_packed: false },
      { product_id: 'BLB-001', quantity: 50, unit: 'kg', is_packed: false },
      { product_id: 'RSP-001', quantity: 50, unit: 'kg', is_packed: false },
    ]
  );
  console.log('  ✓ ORD-DEMO-001 — ASSIGNED to l1 (150kg, 3 items) — PACK THIS ONE');

  // 2) PACKED order for l1 — triggers QC feedback on login
  const packedAt = new Date(Date.now() - 86400000).toISOString();
  await insertOrder(
    {
      order_id: 'ORD-DEMO-002',
      customer_name: 'Chennai Mart',
      customer_phone: '9123456780',
      status: 'ERROR',
      assigned_worker_id: 'WRK-001',
      assignment_type: 'batch',
      total_weight_kg: 30,
      packed_at: packedAt,
      packed_by: 'WRK-001',
      source: 'excel',
      notes: 'Demo: QC error logged — l1 sees feedback on login',
      created_at: packedAt,
    },
    [
      { product_id: 'STR-001', quantity: 30, unit: 'kg', is_packed: true, packed_at: packedAt, packed_by: 'WRK-001' },
    ]
  );
  console.log('  ✓ ORD-DEMO-002 — PACKED+ERROR, QC feedback for l1');

  // 3) PACKING in progress for l4
  await insertOrder(
    {
      order_id: 'ORD-DEMO-003',
      customer_name: 'Kochi Fresh',
      customer_phone: '9988776655',
      status: 'PACKING',
      assigned_worker_id: 'WRK-004',
      assignment_type: 'batch',
      lock_token: randomUUID(),
      locked_by: 'WRK-004',
      locked_at: NOW,
      total_weight_kg: 80,
      source: 'manual',
      created_at: NOW,
    },
    [
      { product_id: 'MGO-001', quantity: 50, unit: 'kg', is_packed: true, packed_at: NOW, packed_by: 'WRK-004' },
      { product_id: 'TOM-001', quantity: 30, unit: 'kg', is_packed: false },
    ]
  );
  console.log('  ✓ ORD-DEMO-003 — PACKING on l4 (1/2 items done)');

  // 4) ASSIGNED to l7
  await insertOrder(
    {
      order_id: 'ORD-DEMO-004',
      customer_name: 'Delhi Wholesale',
      customer_phone: '9012345678',
      status: 'ASSIGNED',
      assigned_worker_id: 'WRK-007',
      assignment_type: 'batch',
      total_weight_kg: 45,
      source: 'excel',
      import_batch_id: 'BATCH-DEMO-001',
      created_at: NOW,
    },
    [
      { product_id: 'CAR-001', quantity: 25, unit: 'kg', is_packed: false },
      { product_id: 'APL-001', quantity: 20, unit: 'kg', is_packed: false },
    ]
  );
  console.log('  ✓ ORD-DEMO-004 — ASSIGNED to l7 (45kg)');

  // 5) Overflow pool — anyone can claim
  await insertOrder(
    {
      order_id: 'ORD-DEMO-005',
      customer_name: 'Small Shop',
      customer_phone: '9000000001',
      status: 'PENDING',
      assigned_worker_id: null,
      assignment_type: 'overflow',
      total_weight_kg: 2,
      source: 'manual',
      notes: 'Demo: overflow pool — claim from Available orders',
      created_at: NOW,
    },
    [
      { product_id: 'BRY-001', quantity: 2, unit: 'kg', is_packed: false },
    ]
  );
  console.log('  ✓ ORD-DEMO-005 — OVERFLOW pool (2kg)');

  // 6) PACKED clean order for l9
  await insertOrder(
    {
      order_id: 'ORD-DEMO-006',
      customer_name: 'Green Valley',
      customer_phone: '9111222333',
      status: 'PACKED',
      assigned_worker_id: 'WRK-009',
      assignment_type: 'batch',
      total_weight_kg: 60,
      packed_at: NOW,
      packed_by: 'WRK-009',
      source: 'manual',
      created_at: NOW,
    },
    [
      { product_id: 'APL-001', quantity: 30, unit: 'kg', is_packed: true, packed_at: NOW, packed_by: 'WRK-009' },
      { product_id: 'MGO-001', quantity: 30, unit: 'kg', is_packed: true, packed_at: NOW, packed_by: 'WRK-009' },
    ]
  );
  console.log('  ✓ ORD-DEMO-006 — PACKED by l9 (dashboard stats)');

  // 7) PENDING unassigned
  await insertOrder(
    {
      order_id: 'ORD-DEMO-007',
      customer_name: 'Pending Customer',
      customer_phone: '9444555666',
      status: 'PENDING',
      assigned_worker_id: 'WRK-002',
      assignment_type: 'batch',
      total_weight_kg: 25,
      source: 'excel',
      created_at: NOW,
    },
    [
      { product_id: 'TOM-001', quantity: 25, unit: 'kg', is_packed: false },
    ]
  );
  console.log('  ✓ ORD-DEMO-007 — ASSIGNED to l2 (25kg tomato)');
}

async function seedQcAndLogs() {
  console.log('Seeding QC errors & packing logs...');

  await supabase.from('qc_errors').insert({
    order_id: 'ORD-DEMO-002',
    worker_id: 'WRK-001',
    logged_by: 'WRK-ADMIN',
    error_code: 'ERR-003',
    error_note: 'Raspberry bruised — demo QC feedback',
    shift_date: TODAY,
  });
  console.log('  ✓ QC error on ORD-DEMO-002 → l1 sees feedback modal');

  const logs = [
    { order_id: 'ORD-DEMO-003', worker_id: 'WRK-004', product_id: 'MGO-001', action: 'SCAN_CORRECT', match: true },
    { order_id: 'ORD-DEMO-003', worker_id: 'WRK-004', product_id: 'MGO-001', action: 'PACK_ITEM', match: true },
    { order_id: 'ORD-DEMO-006', worker_id: 'WRK-009', product_id: 'APL-001', action: 'ORDER_COMPLETE', match: true },
    { order_id: 'ORD-DEMO-006', worker_id: 'WRK-009', action: 'LOGIN', match: null },
  ];
  await supabase.from('packing_log').insert(logs);
  console.log('  ✓ Packing log entries for activity feed');

  const loads = [
    { worker_id: 'WRK-001', load_date: TODAY, assigned_kg: 180, packed_kg: 30, order_count: 2, error_count: 1 },
    { worker_id: 'WRK-004', load_date: TODAY, assigned_kg: 80, packed_kg: 50, order_count: 1, error_count: 0 },
    { worker_id: 'WRK-007', load_date: TODAY, assigned_kg: 45, packed_kg: 0, order_count: 1, error_count: 0 },
    { worker_id: 'WRK-009', load_date: TODAY, assigned_kg: 60, packed_kg: 60, order_count: 1, error_count: 0 },
    { worker_id: 'WRK-002', load_date: TODAY, assigned_kg: 25, packed_kg: 0, order_count: 1, error_count: 0 },
  ];
  for (const load of loads) {
    await supabase.from('worker_daily_load').upsert(load, { onConflict: 'worker_id,load_date' });
  }
  console.log('  ✓ Worker daily load stats');
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env vars in .env.local');
    process.exit(1);
  }

  await cleanupDemo();
  await seedAccounts();
  await seedDemoOrders();
  await seedQcAndLogs();

  console.log('\n══════════════════════════════════════════');
  console.log('  DEMO SEED COMPLETE — TEST CREDENTIALS');
  console.log('══════════════════════════════════════════');
  console.log('');
  console.log('  MANAGER (day-to-day operations):');
  console.log('    Username: manager');
  console.log('    Password: manager123');
  console.log('');
  console.log('  ADMIN (full system access):');
  console.log('    Username: admin');
  console.log('    Password: admin123');
  console.log('');
  console.log('  WORKERS (packing app):');
  console.log('    l1 – l10  /  farmscan123');
  console.log('');
  console.log('  BEST TEST ACCOUNTS:');
  console.log('    l1  → ORD-DEMO-001 packing + QC feedback modal');
  console.log('    l4  → ORD-DEMO-003 in-progress (1/2 packed)');
  console.log('    l7  → ORD-DEMO-004 assigned order');
  console.log('    l9  → ORD-DEMO-006 already packed');
  console.log('    any → ORD-DEMO-005 overflow claim');
  console.log('');
  console.log('  Open: http://localhost:3000/worker/login');
  console.log('══════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
