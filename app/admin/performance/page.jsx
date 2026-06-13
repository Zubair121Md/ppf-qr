'use client';

import { useState, useEffect, useMemo } from 'react';
import AdminShell from '@/components/layouts/AdminShell';
import WorkerPerformanceSummary from '@/components/admin/WorkerPerformanceSummary';
import WorkerDetailModal from '@/components/admin/WorkerDetailModal';
import Spinner from '@/components/ui/Spinner';
import { RUPEES_PER_POINT } from '@/lib/gamification';

const PERIOD_OPTIONS = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

export default function AdminPerformancePage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [sortBy, setSortBy] = useState('points');

  const periodLabel = PERIOD_OPTIONS.find((p) => p.days === days)?.label || `${days} days`;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/workers/performance?days=${days}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setWorkers)
      .finally(() => setLoading(false));
  }, [days]);

  const sortedWorkers = useMemo(() => {
    const list = [...workers];
    const getVal = (w, key) => {
      const p = w.performance || {};
      switch (key) {
        case 'earnings': return p.estimated_earnings || 0;
        case 'today': return p.today?.orders_packed || 0;
        case 'errors': return p.qc_errors?.length || 0;
        case 'kg': return p.today?.kg_packed || 0;
        default: return p.total_points || 0;
      }
    };
    list.sort((a, b) => getVal(b, sortBy) - getVal(a, sortBy));
    return list;
  }, [workers, sortBy]);

  return (
    <AdminShell title="Worker Performance & Payroll">
      <p className="text-sm text-gray-500 mb-6 -mt-2">
        Live packing output, gamification levels, estimated payouts, and QC accountability for all active packers.
      </p>

      <WorkerPerformanceSummary workers={workers} periodLabel={periodLabel} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-8 mb-4">
        <h2 className="text-base font-semibold text-gray-800">Team leaderboard</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-sm border rounded-lg px-3 py-2 bg-white"
          >
            {PERIOD_OPTIONS.map((p) => (
              <option key={p.days} value={p.days}>Period: {p.label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 bg-white"
          >
            <option value="points">Sort by points</option>
            <option value="earnings">Sort by payout</option>
            <option value="today">Sort by today orders</option>
            <option value="kg">Sort by kg today</option>
            <option value="errors">Sort by QC errors</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : sortedWorkers.length === 0 ? (
        <div className="bg-surface-card rounded-2xl border p-8 text-center text-gray-500">
          No active workers found.
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {sortedWorkers.map((w, idx) => {
              const p = w.performance || {};
              const level = p.level || {};
              return (
                <button
                  key={w.worker_id}
                  type="button"
                  onClick={() => setSelectedWorkerId(w.worker_id)}
                  className="w-full text-left bg-surface-card rounded-2xl border border-gray-100 p-4 shadow-card"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-ppf-purple/10 text-ppf-purple font-bold text-sm flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-gray-900">{w.full_name}</p>
                        <p className="text-xs text-gray-400 font-mono">@{w.username}</p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg"
                      style={{ backgroundColor: `${level.color}22`, color: level.color }}
                    >
                      {level.name?.replace(' Packer', '') || 'Bronze'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="font-bold text-gray-900">{p.total_points ?? 0}</p>
                      <p className="text-gray-400">Points</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="font-bold text-green-700">₹{p.estimated_earnings ?? 0}</p>
                      <p className="text-gray-400">Payout</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="font-bold">{p.today?.orders_packed ?? 0}</p>
                      <p className="text-gray-400">Today</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className={`font-bold ${(p.qc_errors?.length || 0) > 0 ? 'text-red-600' : ''}`}>
                        {p.qc_errors?.length ?? 0}
                      </p>
                      <p className="text-gray-400">QC</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-surface-card rounded-2xl border border-gray-100 overflow-hidden shadow-card admin-table-wrap">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-700 w-10">#</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Worker</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Level</th>
                  <th className="p-3 text-right font-semibold text-gray-700">Total pts</th>
                  <th className="p-3 text-right font-semibold text-gray-700">Period (+/−)</th>
                  <th className="p-3 text-right font-semibold text-gray-700">Today</th>
                  <th className="p-3 text-right font-semibold text-gray-700">Kg today</th>
                  <th className="p-3 text-right font-semibold text-gray-700">QC ({periodLabel})</th>
                  <th className="p-3 text-right font-semibold text-gray-700">Est. payout</th>
                  <th className="p-3 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedWorkers.map((w, idx) => {
                  const p = w.performance || {};
                  const level = p.level || {};
                  return (
                    <tr key={w.worker_id} className="border-t border-gray-100 hover:bg-gray-50/60">
                      <td className="p-3 text-gray-400 font-medium">{idx + 1}</td>
                      <td className="p-3">
                        <p className="font-medium text-gray-900">{w.full_name}</p>
                        <p className="text-xs text-gray-400 font-mono">@{w.username}</p>
                      </td>
                      <td className="p-3">
                        <span
                          className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: `${level.color}18`, color: level.color }}
                        >
                          {level.name || 'Bronze Packer'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">{p.total_points ?? 0}</td>
                      <td className="p-3 text-right font-mono text-xs">
                        <span className="text-green-600">+{p.period_earned ?? 0}</span>
                        {' / '}
                        <span className="text-red-600">{p.period_lost ?? 0}</span>
                      </td>
                      <td className="p-3 text-right">{p.today?.orders_packed ?? 0}</td>
                      <td className="p-3 text-right">{p.today?.kg_packed ?? 0} kg</td>
                      <td className="p-3 text-right">
                        <span className={(p.qc_errors?.length || 0) > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                          {p.qc_errors?.length ?? 0}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <p className="font-semibold text-green-700">₹{p.estimated_earnings ?? 0}</p>
                        <p className="text-[10px] text-gray-400">@ ₹{RUPEES_PER_POINT}/pt</p>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedWorkerId(w.worker_id)}
                          className="text-ppf-purple text-sm font-medium hover:underline"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedWorkerId && (
        <WorkerDetailModal
          workerId={selectedWorkerId}
          onClose={() => setSelectedWorkerId(null)}
        />
      )}
    </AdminShell>
  );
}
