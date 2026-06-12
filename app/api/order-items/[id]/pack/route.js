import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const worker = await getWorkerFromRequest(request);
  if (!worker) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const itemId = parseInt(params.id, 10);

  const { data: item, error: itemError } = await supabaseAdmin
    .from('order_items')
    .select('*, products(product_id, name_english)')
    .eq('item_id', itemId)
    .single();

  if (itemError || !item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  const { data: updatedItem, error: updateError } = await supabaseAdmin
    .from('order_items')
    .update({
      is_packed: true,
      packed_at: new Date().toISOString(),
      packed_by: worker.worker_id,
      scan_count: (item.scan_count || 0) + 1,
    })
    .eq('item_id', itemId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  await supabaseAdmin.from('packing_log').insert({
    order_id: item.order_id,
    order_item_id: itemId,
    worker_id: worker.worker_id,
    product_id: item.product_id,
    action: body.action === 'SCAN_CORRECT' ? 'SCAN_CORRECT' : 'PACK_ITEM',
    scanned_qr: body.scanned_qr || null,
    expected_qr: body.expected_qr || null,
    match: body.match ?? true,
  });

  const { data: allItems } = await supabaseAdmin
    .from('order_items')
    .select('is_packed')
    .eq('order_id', item.order_id);

  const orderComplete = (allItems || []).every((i) => i.is_packed);

  if (orderComplete) {
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'PACKED',
        packed_at: new Date().toISOString(),
        packed_by: worker.worker_id,
      })
      .eq('order_id', item.order_id);

    await supabaseAdmin.from('packing_log').insert({
      order_id: item.order_id,
      worker_id: worker.worker_id,
      action: 'ORDER_COMPLETE',
    });

    const today = new Date().toISOString().split('T')[0];
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('total_weight_kg')
      .eq('order_id', item.order_id)
      .single();

    const { data: existingLoad } = await supabaseAdmin
      .from('worker_daily_load')
      .select('*')
      .eq('worker_id', worker.worker_id)
      .eq('load_date', today)
      .single();

    if (existingLoad) {
      await supabaseAdmin
        .from('worker_daily_load')
        .update({
          packed_kg: Number(existingLoad.packed_kg) + Number(order?.total_weight_kg || 0),
        })
        .eq('id', existingLoad.id);
    } else {
      await supabaseAdmin.from('worker_daily_load').insert({
        worker_id: worker.worker_id,
        load_date: today,
        packed_kg: Number(order?.total_weight_kg || 0),
      });
    }
  }

  return NextResponse.json({ item: updatedItem, orderComplete });
}
