'use client';

import {
  POINTS_ORDER_COMPLETE,
  POINTS_PER_KG,
  POINTS_QC_ERROR,
  RUPEES_PER_POINT,
} from '@/lib/gamification';

function SummaryCard({ label, value, sub, accent = 'default' }) {
  const accents = {
    green: 'border-l-green-500',
    purple: 'border-l-ppf-purple',
    amber: 'border-l-amber-400',
    red: 'border-l-red-500',
    default: 'border-l-farm-green',
  };

  return (
    <div className={`bg-surface-card rounded-2xl border border-gray-100 p-4 shadow-card border-l-4 ${accents[accent]}`}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1 text-gray-900">{value}</p>
      {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export function computeTeamSummary(workers) {
  return workers.reduce(
    (acc, w) => {
      const p = w.performance || {};
      acc.totalEarnings += p.estimated_earnings || 0;
      acc.totalPaid += p.payments?.total_paid || 0;
      acc.balanceDue += p.payments?.balance_due || 0;
      acc.periodEarnings += p.period_earnings || 0;
      acc.totalPoints += p.total_points || 0;
      acc.ordersToday += p.today?.orders_packed || 0;
      acc.kgToday += p.today?.kg_packed || 0;
      acc.qcErrors += p.qc_errors?.length || 0;
      acc.periodEarned += p.period_earned || 0;
      acc.periodLost += Math.abs(p.period_lost || 0);
      return acc;
    },
    {
      totalEarnings: 0,
      totalPaid: 0,
      balanceDue: 0,
      periodEarnings: 0,
      totalPoints: 0,
      ordersToday: 0,
      kgToday: 0,
      qcErrors: 0,
      periodEarned: 0,
      periodLost: 0,
    }
  );
}

export default function WorkerPerformanceSummary({ workers, periodLabel = '7 days' }) {
  const summary = computeTeamSummary(workers);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <SummaryCard
          label="Est. total owed"
          value={`₹${summary.totalEarnings.toLocaleString()}`}
          sub={`All-time · ₹${RUPEES_PER_POINT}/point`}
          accent="purple"
        />
        <SummaryCard
          label="Total paid out"
          value={`₹${summary.totalPaid.toLocaleString()}`}
          sub={`Balance due ₹${summary.balanceDue.toLocaleString()}`}
          accent="green"
        />
        <SummaryCard
          label="Packed today"
          value={summary.ordersToday}
          sub={`${summary.kgToday.toFixed(1)} kg across team`}
          accent="amber"
        />
        <SummaryCard
          label={`QC penalties (${periodLabel})`}
          value={summary.qcErrors}
          sub={`−${summary.periodLost} points deducted`}
          accent="red"
        />
      </div>

      <div className="bg-surface-muted/60 rounded-2xl border border-gray-100 p-4 text-sm text-gray-600">
        <p className="font-semibold text-gray-800 mb-2">Gamification & payment rules</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <span>+{POINTS_ORDER_COMPLETE} pts per completed order</span>
          <span>+{POINTS_PER_KG} pt per kg packed</span>
          <span className="text-red-600">{POINTS_QC_ERROR} pts per QC error</span>
          <span>₹{RUPEES_PER_POINT} per point (estimated earnings)</span>
        </div>
      </div>
    </div>
  );
}
