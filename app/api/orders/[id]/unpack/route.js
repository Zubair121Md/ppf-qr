import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest, requireStaff } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const worker = await getWorkerFromRequest(request);
  if (!requireStaff(worker)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const orderId = params.id;

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('order_id, status, assigned_worker_id')
    .eq('order_id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const unpackable = ['PACKED', 'PACKING', 'ERROR'];
  if (!unpackable.includes(order.status)) {
    return NextResponse.json(
      { error: `Cannot unpack order with status ${order.status}. Only packed or in-progress orders can be reset.` },
      { status: 400 }
    );
  }

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .update({
      is_packed: false,
      packed_at: null,
      packed_by: null,
    })
    .eq('order_id', orderId);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const newStatus = order.assigned_worker_id ? 'ASSIGNED' : 'PENDING';

  const { error: orderUpdateError } = await supabaseAdmin
    .from('orders')
    .update({
      status: newStatus,
      packed_at: null,
      packed_by: null,
      lock_token: null,
      locked_by: null,
      locked_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId);

  if (orderUpdateError) {
    return NextResponse.json({ error: orderUpdateError.message }, { status: 500 });
  }

  await supabaseAdmin.from('packing_log').insert({
    order_id: orderId,
    worker_id: worker.worker_id,
    action: 'UNPACK_ORDER',
  });

  return NextResponse.json({
    ok: true,
    order_id: orderId,
    status: newStatus,
  });
}
