import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function PATCH(request, { params }) {
  const worker = await getWorkerFromRequest(request);
  if (!worker) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('order_id', params.id)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.lock_token && order.locked_by && order.locked_by !== worker.worker_id) {
    return NextResponse.json({ error: 'Order already claimed by another worker' }, { status: 409 });
  }

  const lockToken = order.lock_token || randomUUID();
  const isOverflowClaim = order.assignment_type === 'overflow' && !order.assigned_worker_id;

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({
      lock_token: lockToken,
      locked_by: worker.worker_id,
      locked_at: new Date().toISOString(),
      status: 'ASSIGNED',
      assigned_worker_id: order.assigned_worker_id || worker.worker_id,
      ...(isOverflowClaim ? { assignment_type: 'batch' } : {}),
    })
    .eq('order_id', params.id)
    .or(`lock_token.is.null,locked_by.eq.${worker.worker_id}`)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Order already claimed by another worker' }, { status: 409 });
  }

  await supabaseAdmin.from('packing_log').insert({
    order_id: params.id,
    worker_id: worker.worker_id,
    action: 'CLAIM_ORDER',
  });

  return NextResponse.json(data);
}
