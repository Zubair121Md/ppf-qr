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
import { getWorkerLang, syncWorkerLangFromProfile } from '@/lib/speech';
import { STAFF_ROLES } from '@/lib/constants';
import { splitWorkerOrders, canWorkerOpenOrder } from '@/lib/order-status';

export default function WorkerOrdersPage() {
  const router = useRouter();
  const [activeOrders, setActiveOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [overflowOrders, setOverflowOrders] = useState([]);
  const [feedbackErrors, setFeedbackErrors] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [worker, setWorker] = useState(null);
  const [quickStats, setQuickStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const lang = getWorkerLang();

  const loadOrders = useCallback(async (me) => {
    const ordersRes = await fetchWithRetry('/api/orders?worker=me&date=today');
    if (ordersRes.ok) {
      const data = await ordersRes.json();
      const { active, completed, available } = splitWorkerOrders(data, me.worker_id);
      setActiveOrders(active);
      setCompletedOrders(completed);
      setOverflowOrders(available);
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

        if (STAFF_ROLES.includes(me.role)) {
          router.replace('/admin');
          return;
        }

        if (me.preferred_lang) {
          syncWorkerLangFromProfile(me.preferred_lang);
        }
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

        const statsRes = await fetch('/api/workers/me/stats?days=7');
        if (statsRes.ok) setQuickStats(await statsRes.json());
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

      {quickStats && (
        <div className="mx-4 -mt-2 mb-4 grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl border p-3 text-center shadow-sm">
            <p className="text-lg font-bold text-ppf-purple">{quickStats.today?.orders_packed ?? 0}</p>
            <p className="text-[10px] text-gray-500 uppercase">Done today</p>
          </div>
          <div className="bg-white rounded-xl border p-3 text-center shadow-sm">
            <p className="text-lg font-bold text-farm-green">{quickStats.total_points ?? 0}</p>
            <p className="text-[10px] text-gray-500 uppercase">Points</p>
          </div>
          <div className="bg-white rounded-xl border p-3 text-center shadow-sm">
            <p className="text-lg font-bold text-gray-800">₹{quickStats.estimated_earnings ?? 0}</p>
            <p className="text-[10px] text-gray-500 uppercase">Earnings</p>
          </div>
        </div>
      )}

      <div className="worker-content space-y-6">
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
            Assigned to you
          </h2>
          {activeOrders.length === 0 ? (
            <EmptyState
              title="No active orders"
              description="Orders assigned to you will appear here. Check Available orders below to claim extra work."
            />
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.order_id}
                  order={order}
                  lang={lang}
                  onClick={() => {
                    if (worker && canWorkerOpenOrder(order, worker.worker_id)) {
                      router.push(`/worker/pack/${order.order_id}`);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {overflowOrders.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 px-1">
              Available to claim
            </h2>
            <p className="text-xs text-gray-400 mb-3 px-1">
              Small overflow orders waiting for a packer. Tap to claim and start packing.
            </p>
            <div className="space-y-3">
              {overflowOrders.map((order) => (
                <OrderCard
                  key={order.order_id}
                  order={order}
                  lang={lang}
                  statusOverride="PENDING"
                  statusLabel="Available"
                  onClick={() => claimOrder(order.order_id)}
                />
              ))}
            </div>
          </section>
        )}

        {completedOrders.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              Completed today
            </h2>
            <div className="space-y-3">
              {completedOrders.map((order) => (
                <OrderCard
                  key={order.order_id}
                  order={order}
                  lang={lang}
                  dimmed
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </WorkerShell>
  );
}
