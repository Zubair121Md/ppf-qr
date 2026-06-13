'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/layouts/AdminShell';
import OrderImport from '@/components/admin/OrderImport';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import OrderAssignSelect from '@/components/admin/OrderAssignSelect';
import { getOrderStatusLabel, canUnpackOrder } from '@/lib/order-status';

function packedProgress(order) {
  const items = order.order_items || [];
  if (!items.length) return '0/0';
  const packed = items.filter((i) => i.is_packed).length;
  return `${packed}/${items.length}`;
}

function canUnpack(order) {
  return canUnpackOrder(order);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [workerList, setWorkerList] = useState([]);
  const [workers, setWorkers] = useState({});
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [unpackTarget, setUnpackTarget] = useState(null);
  const [unpacking, setUnpacking] = useState(false);

  async function loadOrders() {
    const [ordersRes, workersRes] = await Promise.all([
      fetch('/api/orders'),
      fetch('/api/workers'),
    ]);
    if (workersRes.ok) {
      const w = await workersRes.json();
      setWorkers(Object.fromEntries(w.map((x) => [x.worker_id, x])));
      setWorkerList(w.filter((x) => x.role === 'worker' && x.is_active));
    }
    if (ordersRes.ok) {
      setOrders(await ordersRes.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleUnpack(orderId) {
    setUnpacking(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/unpack`, { method: 'PATCH' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUnpackTarget(null);
        await loadOrders();
      } else {
        alert(data.error || 'Unpack failed');
      }
    } finally {
      setUnpacking(false);
    }
  }

  const todayOrders = orders.filter((o) => {
    const d = new Date(o.created_at).toDateString();
    return d === new Date().toDateString();
  });

  return (
    <AdminShell
      title="Orders"
      actions={
        <button
          type="button"
          onClick={() => setShowImport(!showImport)}
          className="h-10 px-4 text-sm font-medium rounded-xl bg-ppf-purple text-white"
        >
          {showImport ? 'Hide import' : 'Import orders'}
        </button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-surface-card rounded-2xl border border-gray-100 p-4 shadow-card">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Today</p>
            <p className="text-2xl font-bold text-gray-900">{todayOrders.length}</p>
          </div>
          <div className="bg-surface-card rounded-2xl border border-gray-100 p-4 shadow-card">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-surface-card rounded-2xl border border-gray-100 p-4 shadow-card">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Ready</p>
            <p className="text-2xl font-bold text-blue-700">
              {orders.filter((o) => o.status === 'ASSIGNED').length}
            </p>
          </div>
          <div className="bg-surface-card rounded-2xl border border-gray-100 p-4 shadow-card">
            <p className="text-xs text-gray-500 uppercase tracking-wide">In progress</p>
            <p className="text-2xl font-bold text-amber-700">
              {orders.filter((o) => o.status === 'PACKING').length}
            </p>
          </div>
          <div className="bg-surface-card rounded-2xl border border-gray-100 p-4 shadow-card">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Complete</p>
            <p className="text-2xl font-bold text-green-700">
              {orders.filter((o) => o.status === 'PACKED').length}
            </p>
          </div>
        </div>

        {showImport && (
          <div className="bg-surface-card rounded-2xl border border-gray-100 p-4 md:p-6 shadow-card">
            <h2 className="font-semibold text-gray-900 mb-4">Import orders</h2>
            <OrderImport onSuccess={loadOrders} />
          </div>
        )}

        <div>
          <h2 className="font-semibold text-gray-900 mb-1">All orders</h2>
          <p className="text-xs text-gray-500 mb-3">
            Assign workers manually using the dropdown. Unassigned orders go to the overflow pool or wait for auto-distribution on import.
          </p>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="bg-surface-card rounded-2xl border border-gray-100 p-8 text-center shadow-card">
              <p className="text-gray-600">No orders yet. Import from Excel or run demo seed.</p>
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {orders.map((o) => (
                  <div key={o.order_id} className="bg-surface-card rounded-2xl border border-gray-100 p-4 shadow-card">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold font-mono text-sm">{o.order_id}</p>
                        <p className="text-gray-700">{o.customer_name}</p>
                      </div>
                      <Badge status={o.status}>{getOrderStatusLabel(o.status, true)}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                      <span>{o.total_weight_kg} kg</span>
                      <span>Items: {packedProgress(o)}</span>
                      <span className="col-span-2">
                        Worker:{' '}
                        <OrderAssignSelect
                          order={o}
                          workers={workerList}
                          onAssigned={loadOrders}
                          compact
                        />
                      </span>
                      <span className="col-span-2 text-xs text-gray-400">
                        {new Date(o.created_at).toLocaleString()}
                      </span>
                    </div>
                    {canUnpack(o) && (
                      <Button
                        size="sm"
                        variant="secondary"
                        fullWidth
                        onClick={() => setUnpackTarget(o)}
                      >
                        Unpack order
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="hidden md:block bg-surface-card rounded-2xl border border-gray-100 overflow-hidden shadow-card admin-table-wrap">
                <table className="w-full text-sm min-w-[980px]">
                  <thead className="bg-surface-muted">
                    <tr>
                      <th className="p-3 text-left font-semibold text-gray-700">Order ID</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Customer</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Weight</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Status</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Worker</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Progress</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Date</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.order_id} className="border-t border-gray-100 hover:bg-gray-50/50">
                        <td className="p-3 font-mono text-xs">{o.order_id}</td>
                        <td className="p-3 font-medium">{o.customer_name}</td>
                        <td className="p-3">{o.total_weight_kg} kg</td>
                        <td className="p-3">
                          <Badge status={o.status}>{getOrderStatusLabel(o.status, true)}</Badge>
                        </td>
                        <td className="p-3">
                          <OrderAssignSelect
                            order={o}
                            workers={workerList}
                            onAssigned={loadOrders}
                          />
                        </td>
                        <td className="p-3">{packedProgress(o)} items</td>
                        <td className="p-3 text-gray-500 text-xs">
                          {new Date(o.created_at).toLocaleString()}
                        </td>
                        <td className="p-3">
                          {canUnpack(o) ? (
                            <button
                              type="button"
                              onClick={() => setUnpackTarget(o)}
                              className="text-amber-700 text-sm font-medium hover:underline"
                            >
                              Unpack
                            </button>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {unpackTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 safe-top safe-bottom safe-x p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-sheet">
            <h3 className="font-bold text-lg mb-2">Unpack this order?</h3>
            <p className="text-gray-600 text-sm mb-1 font-mono">{unpackTarget.order_id}</p>
            <p className="text-gray-600 text-sm mb-6">
              {unpackTarget.customer_name} · {unpackTarget.total_weight_kg} kg
            </p>
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6">
              This will reset a completed order back to Ready so the worker can pack it again.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setUnpackTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                fullWidth
                disabled={unpacking}
                onClick={() => handleUnpack(unpackTarget.order_id)}
              >
                {unpacking ? 'Unpacking...' : 'Confirm unpack'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
