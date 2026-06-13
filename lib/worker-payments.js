import { supabaseAdmin } from './db';

export const PAYMENT_TYPES = {
  salary: { label: 'Salary / Wage', color: '#16A34A' },
  bonus: { label: 'Bonus', color: '#7B3F9E' },
  advance: { label: 'Advance', color: '#D97706' },
  incentive: { label: 'Incentive reward', color: '#2563EB' },
  other: { label: 'Other', color: '#6B7280' },
};

export async function getWorkerPayments(workerId, { days = 90 } = {}) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabaseAdmin
    .from('worker_payments')
    .select('*')
    .eq('worker_id', workerId)
    .gte('paid_at', since.toISOString())
    .order('paid_at', { ascending: false });

  if (error) {
    console.error('getWorkerPayments:', error.message);
    return [];
  }
  return data || [];
}

export async function getWorkerPaymentTotals(workerId) {
  const { data, error } = await supabaseAdmin
    .from('worker_payments')
    .select('amount, bonus_points, payment_type')
    .eq('worker_id', workerId);

  if (error) {
    console.error('getWorkerPaymentTotals:', error.message);
    return { total_paid: 0, total_bonus_points: 0, payment_count: 0 };
  }

  const rows = data || [];
  return {
    total_paid: rows.reduce((s, r) => s + Number(r.amount || 0), 0),
    total_bonus_points: rows.reduce((s, r) => s + Number(r.bonus_points || 0), 0),
    payment_count: rows.length,
  };
}

export async function recordWorkerPayment({
  workerId,
  amount,
  paymentType,
  bonusPoints = 0,
  note,
  recordedBy,
}) {
  const { data, error } = await supabaseAdmin
    .from('worker_payments')
    .insert({
      worker_id: workerId,
      amount,
      payment_type: paymentType,
      bonus_points: bonusPoints || 0,
      note,
      recorded_by: recordedBy,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
