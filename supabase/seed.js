const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const WORKERS = [
  { worker_id: 'WRK-001', username: 'l1', full_name: 'Worker L1', preferred_lang: 'tamil' },
  { worker_id: 'WRK-002', username: 'l2', full_name: 'Worker L2', preferred_lang: 'tamil' },
  { worker_id: 'WRK-003', username: 'l3', full_name: 'Worker L3', preferred_lang: 'tamil' },
  { worker_id: 'WRK-004', username: 'l4', full_name: 'Worker L4', preferred_lang: 'malayalam' },
  { worker_id: 'WRK-005', username: 'l5', full_name: 'Worker L5', preferred_lang: 'malayalam' },
  { worker_id: 'WRK-006', username: 'l6', full_name: 'Worker L6', preferred_lang: 'malayalam' },
  { worker_id: 'WRK-007', username: 'l7', full_name: 'Worker L7', preferred_lang: 'hindi' },
  { worker_id: 'WRK-008', username: 'l8', full_name: 'Worker L8', preferred_lang: 'hindi' },
  { worker_id: 'WRK-009', username: 'l9', full_name: 'Worker L9', preferred_lang: 'english' },
  { worker_id: 'WRK-010', username: 'l10', full_name: 'Worker L10', preferred_lang: 'english' },
];

const PRODUCTS = [
  {
    product_id: 'STR-001',
    name_english: 'Strawberry',
    name_tamil: 'ஸ்ட்ராபெரி',
    name_malayalam: 'സ്ട്രോബെറി',
    name_hindi: 'स्ट्रॉबेरी',
    category: 'BERRY',
    unit: 'kg',
  },
  {
    product_id: 'BLB-001',
    name_english: 'Blueberry',
    name_tamil: 'ப்ளூபெரி',
    name_malayalam: 'ബ്ലൂബെറി',
    name_hindi: 'ब्लूबेरी',
    category: 'BERRY',
    unit: 'kg',
  },
  {
    product_id: 'RSP-001',
    name_english: 'Raspberry',
    name_tamil: 'ராஸ்பெரி',
    name_malayalam: 'റാസ്ബെറി',
    name_hindi: 'रास्पबेरी',
    category: 'BERRY',
    unit: 'kg',
  },
  {
    product_id: 'MGO-001',
    name_english: 'Mango',
    name_tamil: 'மாம்பழம்',
    name_malayalam: 'മാങ്ങ',
    name_hindi: 'आम',
    category: 'FRT',
    unit: 'kg',
  },
  {
    product_id: 'TOM-001',
    name_english: 'Tomato',
    name_tamil: 'தக்காளி',
    name_malayalam: 'തക്കാളി',
    name_hindi: 'टमाटर',
    category: 'VEG',
    unit: 'kg',
  },
];

async function seed() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env vars in .env.local');
    process.exit(1);
  }

  const workerPassword = await bcrypt.hash('farmscan123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  console.log('Seeding workers...');
  for (const w of WORKERS) {
    const { error } = await supabase.from('workers').upsert({
      ...w,
      password_hash: workerPassword,
      role: 'worker',
      is_active: true,
    });
    if (error) console.error(`Worker ${w.username}:`, error.message);
    else console.log(`  ✓ ${w.username}`);
  }

  const { error: adminError } = await supabase.from('workers').upsert({
    worker_id: 'WRK-ADMIN',
    username: 'admin',
    password_hash: adminPassword,
    full_name: 'Admin User',
    preferred_lang: 'english',
    role: 'admin',
    is_active: true,
  });
  if (adminError) console.error('Admin:', adminError.message);
  else console.log('  ✓ admin');

  console.log('Seeding products...');
  for (const p of PRODUCTS) {
    const { error } = await supabase.from('products').upsert({
      ...p,
      qr_url: `${APP_URL}/p/${p.product_id}`,
      is_active: true,
    });
    if (error) console.error(`Product ${p.product_id}:`, error.message);
    else console.log(`  ✓ ${p.product_id}`);
  }

  console.log('\nSeed complete!');
  console.log('Worker logins: l1–l10 / farmscan123');
  console.log('Admin login: admin / admin123');
}

seed().catch(console.error);
