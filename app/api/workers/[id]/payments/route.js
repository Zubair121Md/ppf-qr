import { NextResponse } from 'next/server';
import { getWorkerFromRequest, requireStaff } from '@/lib/auth';
import { getWorkerPayments, recordWorkerPayment, PAYMENT_TYPES } from '@/lib/worker-payments';
import { awardPoints } from '@/lib/worker-stats';
import { logEvent, getRequestMeta } from '@/lib/audit';

export async function GET(request, { params }) {
  const staff = await getWorkerFromRequest(request);
  if (!requireStaff(staff)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '90', 10);
  const payments = await getWorkerPayments(params.id, { days });

  return NextResponse.json(payments);
}

export async function POST(request, { params }) {
  const staff = await getWorkerFromRequest(request);
  if (!requireStaff(staff)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const amount = Number(body.amount);
    const paymentType = body.payment_type || 'salary';
    const bonusPoints = parseInt(body.bonus_points || '0', 10);
    const note = body.note?.trim() || null;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    if (!PAYMENT_TYPES[paymentType]) {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    const payment = await recordWorkerPayment({
      workerId: params.id,
      amount,
      paymentType,
      bonusPoints,
      note,
      recordedBy: staff.worker_id,
    });

    if (bonusPoints > 0) {
      await awardPoints({
        workerId: params.id,
        points: bonusPoints,
        reason: 'MANUAL_REWARD',
        refType: 'payment',
        refId: payment.id,
        note: note || `${PAYMENT_TYPES[paymentType].label} bonus points`,
      });
    }

    const meta = getRequestMeta(request);
    await logEvent({
      event_type: 'WORKER_PAYMENT',
      actor_id: staff.worker_id,
      actor_role: staff.role,
      target_type: 'worker',
      target_id: params.id,
      ip_address: meta.ip_address,
      user_agent: meta.user_agent,
      details: { amount, payment_type: paymentType, bonus_points: bonusPoints },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to record payment' }, { status: 400 });
  }
}
