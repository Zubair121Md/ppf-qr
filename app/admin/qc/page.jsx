'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/layouts/AdminShell';
import Button from '@/components/ui/Button';
import QCErrorForm from '@/components/admin/QCErrorForm';
import { ERROR_CODES } from '@/lib/constants';

export default function AdminQCPage() {
  const [errors, setErrors] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filterWorker, setFilterWorker] = useState('');
  const [filterUnacked, setFilterUnacked] = useState(false);

  async function loadData() {
    const params = new URLSearchParams();
    if (filterWorker) params.set('worker_id', filterWorker);
    if (filterUnacked) params.set('unacked_only', 'true');

    const [errorsRes, workersRes] = await Promise.all([
      fetch(`/api/qc-errors?${params}`),
      fetch('/api/workers'),
    ]);

    if (errorsRes.ok) setErrors(await errorsRes.json());
    if (workersRes.ok) {
      const w = await workersRes.json();
      setWorkers(w.filter((x) => x.role === 'worker'));
    }
  }

  useEffect(() => {
    loadData();
  }, [filterWorker, filterUnacked]);

  const totalErrors = errors.length;
  const workerErrorCounts = {};
  errors.forEach((e) => {
    workerErrorCounts[e.worker_id] = (workerErrorCounts[e.worker_id] || 0) + 1;
  });
  const mostErrorsWorker = Object.entries(workerErrorCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <AdminShell
      title="QC Error Log"
      actions={
        <Button size="sm" variant="danger" onClick={() => setShowForm(true)}>Log New Error</Button>
      }
    >

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Total Errors (filtered)</p>
            <p className="text-2xl font-bold">{totalErrors}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Most Errors</p>
            <p className="text-lg font-bold">
              {mostErrorsWorker
                ? workers.find((w) => w.worker_id === mostErrorsWorker[0])?.full_name || 'N/A'
                : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <select
            value={filterWorker}
            onChange={(e) => setFilterWorker(e.target.value)}
            className="p-2 border rounded-lg"
          >
            <option value="">All workers</option>
            {workers.map((w) => (
              <option key={w.worker_id} value={w.worker_id}>{w.full_name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filterUnacked}
              onChange={(e) => setFilterUnacked(e.target.checked)}
            />
            Unacknowledged only
          </label>
        </div>

        <div className="bg-surface-card rounded-2xl border border-gray-100 overflow-hidden shadow-card admin-table-wrap">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Order ID</th>
                <th className="p-3 text-left">Worker</th>
                <th className="p-3 text-left">Error Type</th>
                <th className="p-3 text-left">Note</th>
                <th className="p-3 text-left">Acknowledged</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((e) => (
                <tr key={e.error_id} className="border-t">
                  <td className="p-3">{new Date(e.logged_at).toLocaleDateString()}</td>
                  <td className="p-3 font-mono">{e.order_id}</td>
                  <td className="p-3">{e.workers?.full_name}</td>
                  <td className="p-3">{ERROR_CODES[e.error_code]?.label || e.error_code}</td>
                  <td className="p-3 max-w-xs truncate">{e.error_note}</td>
                  <td className="p-3">
                    {e.acknowledged_at ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-red-600">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 safe-top safe-bottom safe-x">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90dvh] overflow-y-auto">
            <QCErrorForm
              onSuccess={() => { setShowForm(false); loadData(); }}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </AdminShell>
  );
}
