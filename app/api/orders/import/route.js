import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest, requireAdmin } from '@/lib/auth';
import { calculateTotalWeightFromItems, distributeOrders } from '@/lib/distribute';

export async function POST(request) {
  const worker = await getWorkerFromRequest(request);
  if (!requireAdmin(worker)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { batch_id, orders } = await request.json();

  if (!orders?.length) {
    return NextResponse.json({ error: 'No orders provided' }, { status: 400 });
  }

  const { data: productRows } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('is_active', true);

  const productsMap = Object.fromEntries((productRows || []).map((p) => [p.product_id, p]));
  const validProductIds = new Set(Object.keys(productsMap));

  const orderIds = orders.map((o) => o.order_id);
  const { data: existing } = await supabaseAdmin
    .from('orders')
    .select('order_id')
    .in('order_id', orderIds);

  const existingIds = new Set((existing || []).map((o) => o.order_id));
  const errors = [];
  const validOrders = [];

  for (const order of orders) {
    if (existingIds.has(order.order_id)) {
      errors.push({ order_id: order.order_id, reason: 'Duplicate order_id' });
      continue;
    }

    const invalidProducts = (order.items || []).filter((i) => !validProductIds.has(i.product_id));
    if (invalidProducts.length) {
      errors.push({
        order_id: order.order_id,
        reason: `Invalid product_ids: ${invalidProducts.map((i) => i.product_id).join(', ')}`,
      });
      continue;
    }

    const total_weight_kg = calculateTotalWeightFromItems(order.items, productsMap);
    validOrders.push({ ...order, total_weight_kg });
  }

  if (!validOrders.length) {
    return NextResponse.json({ imported: 0, errors, distribution: [] });
  }

  for (const order of validOrders) {
    await supabaseAdmin.from('orders').insert({
      order_id: order.order_id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      total_weight_kg: order.total_weight_kg,
      notes: order.notes,
      import_batch_id: batch_id,
      source: 'excel',
      status: 'PENDING',
    });

    const items = order.items.map((item) => ({
      order_id: order.order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit: item.unit || 'kg',
    }));

    await supabaseAdmin.from('order_items').insert(items);
  }

  const { data: workers } = await supabaseAdmin
    .from('workers')
    .select('worker_id, full_name')
    .eq('role', 'worker')
    .eq('is_active', true);

  const distributionInput = validOrders.map((o) => ({
    order_id: o.order_id,
    total_weight_kg: o.total_weight_kg,
  }));

  const distribution = distributeOrders(distributionInput, workers || []);

  for (const d of distribution) {
    await supabaseAdmin
      .from('orders')
      .update({
        assigned_worker_id: d.assigned_worker_id,
        assignment_type: d.assignment_type,
        parent_order_id: d.parent_order_id,
        status: d.assigned_worker_id ? 'ASSIGNED' : 'PENDING',
      })
      .eq('order_id', d.order_id);
  }

  const today = new Date().toISOString().split('T')[0];
  const workerStats = {};

  for (const d of distribution) {
    if (!d.assigned_worker_id) continue;
    if (!workerStats[d.assigned_worker_id]) {
      workerStats[d.assigned_worker_id] = { order_count: 0, total_kg: 0 };
    }
    workerStats[d.assigned_worker_id].order_count += 1;
    workerStats[d.assigned_worker_id].total_kg += d.total_weight_kg;
  }

  for (const [worker_id, stats] of Object.entries(workerStats)) {
    const { data: existingLoad } = await supabaseAdmin
      .from('worker_daily_load')
      .select('*')
      .eq('worker_id', worker_id)
      .eq('load_date', today)
      .single();

    if (existingLoad) {
      await supabaseAdmin
        .from('worker_daily_load')
        .update({
          assigned_kg: Number(existingLoad.assigned_kg) + stats.total_kg,
          order_count: Number(existingLoad.order_count) + stats.order_count,
        })
        .eq('id', existingLoad.id);
    } else {
      await supabaseAdmin.from('worker_daily_load').insert({
        worker_id,
        load_date: today,
        assigned_kg: stats.total_kg,
        order_count: stats.order_count,
      });
    }
  }

  const distributionSummary = (workers || []).map((w) => {
    const stats = workerStats[w.worker_id] || { order_count: 0, total_kg: 0 };
    return {
      worker_id: w.worker_id,
      full_name: w.full_name,
      order_count: stats.order_count,
      total_kg: stats.total_kg,
    };
  });

  return NextResponse.json({
    imported: validOrders.length,
    errors,
    distribution: distributionSummary,
  });
}
