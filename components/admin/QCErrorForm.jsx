'use client';

import { useState } from 'react';
import { ERROR_CODES } from '@/lib/constants';

export default function QCErrorForm({ orderId: presetOrderId, onSuccess, onClose }) {
  const [orderId, setOrderId] = useState(presetOrderId || '');
  const [orderInfo, setOrderInfo] = useState(null);
  const [errorCode, setErrorCode] = useState('ERR-001');
  const [errorNote, setErrorNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function lookupOrder() {
    if (!orderId) return;
    const res = await fetch(`/api/orders/${orderId}`);
    if (res.ok) {
      setOrderInfo(await res.json());
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/qc-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, error_code: errorCode, error_note: errorNote }),
      });
      if (res.ok) {
        setSuccess(true);
        onSuccess?.();
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="p-6 text-center">
        <p className="text-green-600 font-medium">
          Error logged. Worker will be notified on next login.
        </p>
        <button type="button" onClick={onClose} className="mt-4 text-farm-green">Close</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <h2 className="text-xl font-bold">Log QC Error</h2>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="flex-1 p-3 border rounded-lg"
          required
        />
        <button type="button" onClick={lookupOrder} className="px-4 py-2 border rounded-lg">
          Lookup
        </button>
      </div>

      {orderInfo && (
        <div className="bg-gray-50 p-3 rounded-lg text-sm">
          <p>Customer: {orderInfo.customer_name}</p>
          <p>Status: {orderInfo.status}</p>
          <p>Packed by: {orderInfo.packed_by || 'N/A'}</p>
        </div>
      )}

      <select
        value={errorCode}
        onChange={(e) => setErrorCode(e.target.value)}
        className="w-full p-3 border rounded-lg"
      >
        {Object.entries(ERROR_CODES).map(([code, info]) => (
          <option key={code} value={code}>
            {code}: {info.label}
          </option>
        ))}
      </select>

      <textarea
        placeholder="Error note (required)"
        value={errorNote}
        onChange={(e) => setErrorNote(e.target.value)}
        className="w-full p-3 border rounded-lg"
        rows={3}
        required
      />

      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 border rounded-lg">
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-red-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Log Error'}
        </button>
      </div>
    </form>
  );
}
