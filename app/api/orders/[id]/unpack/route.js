import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest, requireStaff } from '@/lib/auth';
import { resetOrderItemsForUnpack, syncOrderStatusFromItems } from '@/lib/order-sync';
import { awardPoints, hasLedgerEntry } from '@/lib/worker-stats';

export async function PATCH(request, { params }) {
  const worker = await getWorkerFromRequest(request);
  if (!requireStaff(worker)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const orderId = params.id;

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('order_id, status, assigned_worker_id, packed_by')
    .eq('order_id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status !== 'PACKED') {
    return NextResponse.json(
      { error: 'Only completed orders can be unpacked.' },
      { status: 400 }
    );
  }

  const { error: itemsError } = await resetOrderItemsForUnpack(orderId);
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

  await syncOrderStatusFromItems(orderId);

  await supabaseAdmin.from('packing_log').insert({
    order_id: orderId,
    worker_id: worker.worker_id,
    action: 'UNPACK_ORDER',
  });

  if (order.packed_by) {
    const { data: earned } = await supabaseAdmin
      .from('worker_points_ledger')
      .select('points')
      .eq('worker_id', order.packed_by)
      .eq('order_id', orderId)
      .eq('reason', 'ORDER_COMPLETE')
      .maybeSingle();

    const reverseAlready = await hasLedgerEntry({
      workerId: order.packed_by,
      reason: 'ORDER_UNPACKED',
      orderId,
    });

    if (earned?.points && !reverseAlready) {
      await awardPoints({
        workerId: order.packed_by,
        points: -earned.points,
        reason: 'ORDER_UNPACKED',
        orderId,
        note: 'Points reversed after unpack',
      });
    }
  }

  return NextResponse.json({
    ok: true,
    order_id: orderId,
    status: newStatus,
  });
}
