'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import OrderCard from '@/components/worker/OrderCard';
import FeedbackAlert from '@/components/worker/FeedbackAlert';
import WorkerHeader from '@/components/layouts/WorkerHeader';
import WorkerShell from '@/components/layouts/WorkerShell';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import { IconRefresh } from '@/components/ui/Icons';
import { fetchWithRetry } from '@/lib/fetch-retry';
import { getWorkerLang } from '@/lib/speech';

export default function WorkerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [overflowOrders, setOverflowOrders] = useState([]);
  const [feedbackErrors, setFeedbackErrors] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const lang = getWorkerLang();

  const loadOrders = useCallback(async (me) => {
    const ordersRes = await fetchWithRetry('/api/orders?worker=me&date=today');
    if (ordersRes.ok) {
      const data = await ordersRes.json();
      const assigned = data.filter(
        (o) => o.assigned_worker_id === me.worker_id && o.assignment_type !== 'overflow'
      );
      const overflow = data.filter((o) => o.assignment_type === 'overflow' && !o.assigned_worker_id);
      setOrders(assigned);
      setOverflowOrders(overflow);
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetchWithRetry('/api/auth/me');
        if (!meRes.ok) {
          router.push('/worker/login');
          return;
        }
        const me = await meRes.json();
        setWorker(me);

        const feedbackRes = await fetch(`/api/workers/${me.worker_id}/feedback`);
        if (feedbackRes.ok) {
          const errors = await feedbackRes.json();
          if (errors.length > 0) {
            setFeedbackErrors(errors);
            setShowFeedback(true);
          }
        }

        await loadOrders(me);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router, loadOrders]);

  async function handleRefresh() {
    if (!worker || refreshing) return;
    setRefreshing(true);
    await loadOrders(worker);
    setRefreshing(false);
  }

  async function claimOrder(orderId) {
    const res = await fetch(`/api/orders/${orderId}/claim`, { method: 'PATCH' });
    if (res.ok) {
      router.push(`/worker/pack/${orderId}`);
    } else {
      const data = await res.json();
      alert(data.error || 'Could not claim order');
    }
  }

  if (loading) {
    return (
      <WorkerShell noPadding>
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </WorkerShell>
    );
  }

  return (
    <WorkerShell noPadding>
      {showFeedback && (
        <FeedbackAlert
          errors={feedbackErrors}
          onAllAcknowledged={() => setShowFeedback(false)}
        />
      )}

      <WorkerHeader
        title="My Orders"
        subtitle={worker ? `${worker.full_name} · ${worker.username}` : ''}
        rightAction={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="touch-target w-10 h-10 rounded-xl bg-white/10 text-sm"
            aria-label="Refresh"
          >
            <IconRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="worker-content space-y-3">
        {orders.length === 0 ? (
          <EmptyState
            title="No orders today"
            description="Check back later or claim an available order below"
          />
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.order_id}
              order={order}
              lang={lang}
              onClick={() => {
                if (['PENDING', 'ASSIGNED', 'PACKING'].includes(order.status)) {
                  router.push(`/worker/pack/${order.order_id}`);
                }
              }}
            />
          ))
        )}

        {overflowOrders.length > 0 && (
          <section className="pt-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              Available orders
            </h2>
            <div className="space-y-3">
              {overflowOrders.map((order) => (
                <OrderCard
                  key={order.order_id}
                  order={order}
                  lang={lang}
                  onClick={() => claimOrder(order.order_id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </WorkerShell>
  );
}
