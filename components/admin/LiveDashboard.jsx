'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import WorkerCard from './WorkerCard';
import { computeTeamSummary } from './WorkerPerformanceSummary';

function StatCard({ label, value, sub, accent }) {
  const accents = {
    green: 'border-l-green-500',
    yellow: 'border-l-amber-400',
    gray: 'border-l-gray-400',
    default: 'border-l-farm-green',
  };

  return (
    <div className={`bg-surface-card rounded-2xl border border-gray-100 p-4 shadow-card border-l-4 ${accents[accent] || accents.default}`}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function LiveDashboard() {
  const [performance, setPerformance] = useState([]);
  const [orders, setOrders] = useState([]);

  async function fetchData() {
    const today = new Date().toISOString().split('T')[0];

    const [perfRes, ordersRes] = await Promise.all([
      fetch('/api/workers/performance'),
      fetch('/api/orders'),
    ]);

    if (perfRes.ok) {
      setPerformance(await perfRes.json());
    }

    if (ordersRes.ok) {
      const o = await ordersRes.json();
      setOrders(o.filter((ord) => ord.created_at?.startsWith(today)));
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    total: orders.length,
    packed: orders.filter((x) => x.status === 'PACKED').length,
    inProgress: orders.filter((x) => ['PACKING', 'ASSIGNED'].includes(x.status)).length,
    pending: orders.filter((x) => x.status === 'PENDING').length,
    totalKg: orders.reduce((s, x) => s + Number(x.total_weight_kg || 0), 0),
  };

  function getWorkerStats(workerId) {
    const today = new Date().toISOString().split('T')[0];
    const workerOrders = orders.filter(
      (o) => o.assigned_worker_id === workerId && o.created_at?.startsWith(today)
    );
    const packing = workerOrders.find((o) => o.status === 'PACKING');
    const packedToday = workerOrders.filter((o) => o.status === 'PACKED').length;
    const assignedKg = workerOrders.reduce((s, o) => s + Number(o.total_weight_kg || 0), 0);
    const packedKg = workerOrders
      .filter((o) => o.status === 'PACKED')
      .reduce((s, o) => s + Number(o.total_weight_kg || 0), 0);

    const perf = performance.find((p) => p.worker_id === workerId)?.performance;

    let status = 'IDLE';
    if (packing) status = 'PACKING';
    else if (packedToday > 0) status = 'DONE';

    return {
      status,
      activeOrder: packing ? { order_id: packing.order_id, kg: packing.total_weight_kg } : null,
      packedToday,
      assignedKg,
      packedKg,
      errorsThisWeek: perf?.qc_errors?.length || 0,
      totalPoints: perf?.total_points || 0,
      levelName: perf?.level?.name || 'Bronze Packer',
      levelColor: perf?.level?.color || '#CD7F32',
      estimatedEarnings: perf?.estimated_earnings || 0,
    };
  }

  const teamSummary = computeTeamSummary(performance);

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <StatCard label="Today's Total" value={stats.total} sub={`${stats.totalKg} kg`} />
        <StatCard label="Packed" value={stats.packed} accent="green" />
        <StatCard label="In Progress" value={stats.inProgress} accent="yellow" />
        <StatCard label="Pending" value={stats.pending} accent="gray" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard
          label="Team est. payout"
          value={`₹${teamSummary.totalEarnings.toLocaleString()}`}
          sub="All active packers"
          accent="green"
        />
        <StatCard
          label="Packed today"
          value={teamSummary.ordersToday}
          sub={`${teamSummary.kgToday.toFixed(1)} kg`}
        />
        <StatCard
          label="QC errors (7d)"
          value={teamSummary.qcErrors}
          sub={`−${teamSummary.periodLost} pts`}
          accent="gray"
        />
        <Link href="/admin/performance" className="block">
          <StatCard label="Performance" value="View →" sub="Payroll & gamification" accent="yellow" />
        </Link>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-700">Workers</h2>
        <Link href="/admin/performance" className="text-sm text-ppf-purple font-medium hover:underline">
          Full report
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {performance.map((w) => (
          <WorkerCard key={w.worker_id} worker={w} stats={getWorkerStats(w.worker_id)} />
        ))}
      </div>
    </div>
  );
}
