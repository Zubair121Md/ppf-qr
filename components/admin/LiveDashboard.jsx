'use client';

import { useState, useEffect } from 'react';
import WorkerCard from './WorkerCard';

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
  const [workers, setWorkers] = useState([]);
  const [orders, setOrders] = useState([]);

  async function fetchData() {
    const today = new Date().toISOString().split('T')[0];

    const [workersRes, ordersRes] = await Promise.all([
      fetch('/api/workers'),
      fetch('/api/orders'),
    ]);

    if (workersRes.ok) {
      const w = await workersRes.json();
      setWorkers(w.filter((x) => x.role === 'worker'));
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

    let status = 'IDLE';
    if (packing) status = 'PACKING';
    else if (packedToday > 0) status = 'DONE';

    return {
      status,
      activeOrder: packing ? { order_id: packing.order_id, kg: packing.total_weight_kg } : null,
      packedToday,
      assignedKg,
      packedKg,
      errorsThisWeek: 0,
    };
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard label="Today's Total" value={stats.total} sub={`${stats.totalKg} kg`} />
        <StatCard label="Packed" value={stats.packed} accent="green" />
        <StatCard label="In Progress" value={stats.inProgress} accent="yellow" />
        <StatCard label="Pending" value={stats.pending} accent="gray" />
      </div>

      <h2 className="text-base font-semibold text-gray-700 mb-3">Workers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {workers.map((w) => (
          <WorkerCard key={w.worker_id} worker={w} stats={getWorkerStats(w.worker_id)} />
        ))}
      </div>
    </div>
  );
}
