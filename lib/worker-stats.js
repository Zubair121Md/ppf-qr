import { supabaseAdmin } from './db';
import { calcEarnings, getWorkerLevel } from './gamification';
import { getWorkerPaymentTotals, getWorkerPayments } from './worker-payments';

export async function hasLedgerEntry({ workerId, reason, orderId = null, refType = null, refId = null }) {
  let q = supabaseAdmin
    .from('worker_points_ledger')
    .select('id')
    .eq('worker_id', workerId)
    .eq('reason', reason)
    .limit(1);
  if (orderId) q = q.eq('order_id', orderId);
  if (refType) q = q.eq('ref_type', refType);
  if (refId) q = q.eq('ref_id', String(refId));
  const { data } = await q;
  return (data || []).length > 0;
}

export async function awardPoints({ workerId, points, reason, orderId = null, refType = null, refId = null, note = null }) {
  if (!workerId || !points) return null;
  const { data, error } = await supabaseAdmin
    .from('worker_points_ledger')
    .insert({
      worker_id: workerId,
      points,
      reason,
      order_id: orderId,
      ref_type: refType,
      ref_id: refId ? String(refId) : null,
      note,
    })
    .select()
    .single();
  if (error) console.error('awardPoints:', error.message);
  return data;
}

export async function getWorkerStats(workerId, { days = 30 } = {}) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();
  const today = new Date().toISOString().split('T')[0];

  const [
    ledgerRes,
    ordersRes,
    qcRes,
    dailyRes,
    allTimeLedgerRes,
    paymentTotals,
    recentPayments,
  ] = await Promise.all([
    supabaseAdmin
      .from('worker_points_ledger')
      .select('*')
      .eq('worker_id', workerId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin
      .from('orders')
      .select('order_id, status, total_weight_kg, packed_at, created_at, customer_name')
      .or(`packed_by.eq.${workerId},assigned_worker_id.eq.${workerId}`)
      .gte('created_at', `${today}T00:00:00`),
    supabaseAdmin
      .from('qc_errors')
      .select('error_id, order_id, error_code, error_note, logged_at, acknowledged_at')
      .eq('worker_id', workerId)
      .gte('logged_at', sinceIso)
      .order('logged_at', { ascending: false }),
    supabaseAdmin
      .from('worker_daily_load')
      .select('*')
      .eq('worker_id', workerId)
      .eq('load_date', today)
      .maybeSingle(),
    supabaseAdmin
      .from('worker_points_ledger')
      .select('points')
      .eq('worker_id', workerId),
    getWorkerPaymentTotals(workerId),
    getWorkerPayments(workerId, { days }),
  ]);

  const ledger = ledgerRes.data || [];
  const todayOrders = ordersRes.data || [];
  const qcErrors = qcRes.data || [];
  const allPoints = (allTimeLedgerRes.data || []).reduce((s, r) => s + r.points, 0);
  const periodPoints = ledger.reduce((s, r) => s + r.points, 0);
  const periodEarned = ledger.filter((r) => r.points > 0).reduce((s, r) => s + r.points, 0);
  const periodLost = ledger.filter((r) => r.points < 0).reduce((s, r) => s + r.points, 0);

  const ordersPackedToday = todayOrders.filter((o) => o.status === 'PACKED' && o.packed_at?.startsWith(today)).length;
  const kgPackedToday = todayOrders
    .filter((o) => o.status === 'PACKED' && o.packed_at?.startsWith(today))
    .reduce((s, o) => s + Number(o.total_weight_kg || 0), 0);

  const level = getWorkerLevel(allPoints);
  const estimatedEarnings = calcEarnings(allPoints);
  const balanceDue = Math.max(0, estimatedEarnings - paymentTotals.total_paid);

  return {
    worker_id: workerId,
    total_points: allPoints,
    period_points: periodPoints,
    period_earned: periodEarned,
    period_lost: periodLost,
    estimated_earnings: estimatedEarnings,
    period_earnings: calcEarnings(periodPoints),
    payments: {
      total_paid: paymentTotals.total_paid,
      total_bonus_points: paymentTotals.total_bonus_points,
      payment_count: paymentTotals.payment_count,
      balance_due: balanceDue,
      recent: recentPayments.slice(0, 10),
    },
    level,
    today: {
      orders_packed: ordersPackedToday,
      kg_packed: kgPackedToday,
      errors: dailyRes.data?.error_count || qcErrors.filter((e) => e.logged_at?.startsWith(today)).length,
      points: ledger.filter((r) => r.created_at?.startsWith(today)).reduce((s, r) => s + r.points, 0),
    },
    recent_activity: ledger.slice(0, 15).map((r) => ({
      id: r.id,
      points: r.points,
      reason: r.reason,
      order_id: r.order_id,
      note: r.note,
      created_at: r.created_at,
    })),
    qc_errors: qcErrors.slice(0, 10),
    orders_today: todayOrders,
  };
}

export async function getAllWorkersPerformance({ days = 7 } = {}) {
  const { data: workers } = await supabaseAdmin
    .from('workers')
    .select('worker_id, username, full_name, preferred_lang, is_active')
    .eq('role', 'worker')
    .eq('is_active', true)
    .order('full_name');

  const stats = await Promise.all((workers || []).map((w) => getWorkerStats(w.worker_id, { days })));

  return (workers || []).map((w, i) => ({
    ...w,
    performance: stats[i],
  })).sort((a, b) => b.performance.total_points - a.performance.total_points);
}
