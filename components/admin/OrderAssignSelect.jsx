'use client';

import { useState } from 'react';

export default function OrderAssignSelect({ order, workers, onAssigned, compact = false }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (order.status === 'PACKED') {
    return (
      <span className="text-gray-400 text-xs">
        {workers.find((w) => w.worker_id === order.assigned_worker_id)?.full_name || '—'}
      </span>
    );
  }

  async function handleChange(workerId) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${order.order_id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_id: workerId || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Assign failed');
        return;
      }
      onAssigned?.();
    } catch {
      setError('Connection error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={compact ? '' : 'min-w-[140px]'}>
      <select
        value={order.assigned_worker_id || ''}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value || null)}
        className={`w-full text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-ppf-purple/30 disabled:opacity-50 ${
          compact ? 'p-1.5' : 'p-2'
        }`}
      >
        <option value="">Unassigned</option>
        {workers.map((w) => (
          <option key={w.worker_id} value={w.worker_id}>
            {w.full_name} ({w.username})
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
