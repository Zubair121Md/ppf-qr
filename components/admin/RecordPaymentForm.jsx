'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { PAYMENT_TYPES } from '@/lib/worker-payments';

export default function RecordPaymentForm({ workerId, workerName, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('salary');
  const [bonusPoints, setBonusPoints] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/workers/${workerId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          payment_type: paymentType,
          bonus_points: bonusPoints ? parseInt(bonusPoints, 10) : 0,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to record payment');
        return;
      }
      setAmount('');
      setBonusPoints('');
      setNote('');
      onSuccess?.(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-800">Record payment</p>
        <p className="text-xs text-gray-500">Log cash paid or rewards for {workerName}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Amount (₹)</label>
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2.5 border rounded-xl bg-white text-sm"
            placeholder="500"
            required
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Bonus points (optional)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={bonusPoints}
            onChange={(e) => setBonusPoints(e.target.value)}
            className="w-full p-2.5 border rounded-xl bg-white text-sm"
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Type</label>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
          className="w-full p-2.5 border rounded-xl bg-white text-sm"
        >
          {Object.entries(PAYMENT_TYPES).map(([key, info]) => (
            <option key={key} value={key}>{info.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">Note</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full p-2.5 border rounded-xl bg-white text-sm"
          placeholder="Weekly wage, festival bonus, etc."
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button type="submit" size="sm" fullWidth disabled={loading}>
        {loading ? 'Saving...' : 'Record payment'}
      </Button>
    </form>
  );
}
