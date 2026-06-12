import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest, requireAdmin } from '@/lib/auth';
import { calculateTotalWeightFromItems, distributeOrders } from '@/lib/distribute';

async function getProductsMap() {
  const { data: products } = await supabaseAdmin.from('products').select('*').eq('is_active', true);
  return Object.fromEntries((products || []).map((p) => [p.product_id, p]));
}

async function getActiveWorkers() {
  const { data: workers } = await supabaseAdmin
    .from('workers')
    .select('worker_id, full_name')
    .eq('role', 'worker')
    .eq('is_active', true);
  return workers || [];
}

export async function GET(request) {
  const worker = await getWorkerFromRequest(request);
  if (!worker) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workerFilter = searchParams.get('worker');
  const dateFilter = searchParams.get('date');

  let query = supabaseAdmin
    .from('orders')
    .select(`
      *,
      order_items (
        item_id, product_id, quantity, unit, is_packed,
        products (product_id, name_english, name_tamil, name_malayalam, name_hindi, image_url)
      )
    `)
    .order('created_at', { ascending: false });

  if (workerFilter === 'me') {
    const today = new Date().toISOString().split('T')[0];
    if (dateFilter === 'today') {
      query = query.gte('created_at', `${today}T00:00:00`);
    }
    query = query.or(`assigned_worker_id.eq.${worker.worker_id},and(assignment_type.eq.overflow,assigned_worker_id.is.null)`);
  } else if (!requireAdmin(worker)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request) {
  const worker = await getWorkerFromRequest(request);
  if (!requireAdmin(worker)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { customer_name, customer_phone, items, notes } = body;

  if (!customer_name || !items?.length) {
    return NextResponse.json({ error: 'customer_name and items required' }, { status: 400 });
  }

  const productsMap = await getProductsMap();
  const order_id = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-3)}`;
  const total_weight_kg = calculateTotalWeightFromItems(items, productsMap);

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      order_id,
      customer_name,
      customer_phone,
      total_weight_kg,
      notes,
      source: 'manual',
      status: 'PENDING',
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 400 });
  }

  const orderItems = items.map((item) => ({
    order_id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit: item.unit || 'kg',
  }));

  await supabaseAdmin.from('order_items').insert(orderItems);

  const workers = await getActiveWorkers();
  const [distribution] = distributeOrders([{ order_id, total_weight_kg }], workers);

  if (distribution) {
    await supabaseAdmin
      .from('orders')
      .update({
        assigned_worker_id: distribution.assigned_worker_id,
        assignment_type: distribution.assignment_type,
        status: distribution.assigned_worker_id ? 'ASSIGNED' : 'PENDING',
      })
      .eq('order_id', order_id);
  }

  const assignedWorker = workers.find((w) => w.worker_id === distribution?.assigned_worker_id);

  return NextResponse.json({
    order_id,
    total_weight_kg,
    assigned_worker_id: distribution?.assigned_worker_id,
    assigned_worker_name: assignedWorker?.full_name || null,
    assignment_type: distribution?.assignment_type,
  }, { status: 201 });
}
