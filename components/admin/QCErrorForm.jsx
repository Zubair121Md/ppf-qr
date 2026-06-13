'use client';

import { useState, useEffect } from 'react';
import { ERROR_CODES } from '@/lib/constants';
import { POINTS_QC_ERROR } from '@/lib/gamification';

export default function QCErrorForm({ orderId: presetOrderId, onSuccess, onClose }) {
  const [packedOrders, setPackedOrders] = useState([]);
  const [orderId, setOrderId] = useState(presetOrderId || '');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [errorCode, setErrorCode] = useState('ERR-001');
  const [errorNote, setErrorNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/orders/packed')
      .then((r) => (r.ok ? r.json() : []))
      .then((orders) => {
        setPackedOrders(orders);
        if (presetOrderId) {
          const match = orders.find((o) => o.order_id === presetOrderId);
          if (match) setSelectedOrder(match);
        }
      })
      .finally(() => setLoadingOrders(false));
  }, [presetOrderId]);

  useEffect(() => {
    if (!orderId) {
      setSelectedOrder(null);
      return;
    }
    const match = packedOrders.find((o) => o.order_id === orderId);
    setSelectedOrder(match || null);
  }, [orderId, packedOrders]);

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
      } else {
        const data = await res.json();
        alert(data.error || 'Could not log error');
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="p-6 text-center">
        <p className="text-green-600 font-medium">
          Error logged. Packer gets {POINTS_QC_ERROR} points penalty and will see feedback on next login.
        </p>
        <button type="button" onClick={onClose} className="mt-4 text-farm-green">Close</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <h2 className="text-xl font-bold">Log QC Error</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Packed order</label>
        {loadingOrders ? (
          <p className="text-sm text-gray-400">Loading packed orders...</p>
        ) : (
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          >
            <option value="">Select order ID</option>
            {packedOrders.map((o) => (
              <option key={o.order_id} value={o.order_id}>
                {o.order_id} — {o.customer_name} ({o.total_weight_kg} kg)
                {o.packer ? ` · ${o.packer.full_name}` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedOrder && (
        <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
          <p><span className="text-gray-500">Customer:</span> {selectedOrder.customer_name}</p>
          <p><span className="text-gray-500">Weight:</span> {selectedOrder.total_weight_kg} kg</p>
          <p>
            <span className="text-gray-500">Packed by:</span>{' '}
            <span className="font-semibold text-ppf-purple">
              {selectedOrder.packer?.full_name || selectedOrder.packed_by || 'Unknown'}
            </span>
            {selectedOrder.packer?.username && (
              <span className="text-gray-400 font-mono ml-1">({selectedOrder.packer.username})</span>
            )}
          </p>
          <p className="text-xs text-red-600 mt-2">
            Logging this error will deduct {Math.abs(POINTS_QC_ERROR)} points from this packer.
          </p>
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
          disabled={loading || !orderId}
          className="flex-1 py-3 bg-red-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Log Error'}
        </button>
      </div>
    </form>
  );
}
