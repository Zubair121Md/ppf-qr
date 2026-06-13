import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest, requireStaff } from '@/lib/auth';
import { AssignOrderSchema, OrderIdSchema, parseBody, validationErrorResponse } from '@/lib/validations';
import { logEvent, getRequestMeta } from '@/lib/audit';

const REASSIGNABLE = ['PENDING', 'ASSIGNED', 'PACKING', 'ERROR'];

export async function PATCH(request, { params }) {
  const staff = await getWorkerFromRequest(request);
  if (!requireStaff(staff)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const orderIdResult = OrderIdSchema.safeParse(params.id);
  if (!orderIdResult.success) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = parseBody(AssignOrderSchema, body);
  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const { worker_id: assignWorkerId } = parsed.data;
  const orderId = orderIdResult.data;
  const meta = getRequestMeta(request);

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('order_id, status, assigned_worker_id, total_weight_kg')
    .eq('order_id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status === 'PACKED') {
    return NextResponse.json({ error: 'Cannot reassign a completed order. Unpack it first.' }, { status: 400 });
  }

  if (!REASSIGNABLE.includes(order.status)) {
    return NextResponse.json({ error: `Cannot assign order with status ${order.status}` }, { status: 400 });
  }

  if (assignWorkerId) {
    const { data: targetWorker } = await supabaseAdmin
      .from('workers')
      .select('worker_id, full_name, role, is_active')
      .eq('worker_id', assignWorkerId)
      .single();

    if (!targetWorker || !targetWorker.is_active || targetWorker.role !== 'worker') {
      return NextResponse.json({ error: 'Invalid or inactive worker' }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        assigned_worker_id: assignWorkerId,
        assignment_type: 'manual',
        status: 'ASSIGNED',
        lock_token: null,
        locked_by: null,
        locked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)
      .select('order_id, assigned_worker_id, status, assignment_type')
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await logEvent({
      event_type: 'ORDER_ASSIGNED',
      actor_id: staff.worker_id,
      actor_role: staff.role,
      target_type: 'order',
      target_id: orderId,
      ...meta,
      details: {
        worker_id: assignWorkerId,
        worker_name: targetWorker.full_name,
        previous_worker_id: order.assigned_worker_id,
      },
    });

    return NextResponse.json({
      ok: true,
      order: updated,
      worker_name: targetWorker.full_name,
    });
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      assigned_worker_id: null,
      assignment_type: Number(order.total_weight_kg) < 3 ? 'overflow' : 'batch',
      status: 'PENDING',
      lock_token: null,
      locked_by: null,
      locked_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId)
    .select('order_id, assigned_worker_id, status, assignment_type')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await logEvent({
    event_type: 'ORDER_UNASSIGNED',
    actor_id: staff.worker_id,
    actor_role: staff.role,
    target_type: 'order',
    target_id: orderId,
    ...meta,
    details: { previous_worker_id: order.assigned_worker_id },
  });

  return NextResponse.json({ ok: true, order: updated });
}
