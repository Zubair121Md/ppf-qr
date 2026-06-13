'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import PackingChecklist from '@/components/worker/PackingChecklist';
import ProductConfirm from '@/components/worker/ProductConfirm';
import WorkerHeader from '@/components/layouts/WorkerHeader';
import WorkerShell from '@/components/layouts/WorkerShell';
import ProgressBar from '@/components/ui/ProgressBar';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { IconCheck } from '@/components/ui/Icons';
import {
  getWorkerLang,
  getMessage,
  speakProductName,
  speakMessage,
  syncWorkerLangFromProfile,
} from '@/lib/speech';

function PackOrderContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.orderId;
  const lang = getWorkerLang();

  const [order, setOrder] = useState(null);
  const [worker, setWorker] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get('complete') === 'true') {
      setOrderComplete(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (orderComplete) {
      speakMessage('order_complete', lang);
    }
  }, [orderComplete, lang]);

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/worker/login');
          return;
        }
        const me = await meRes.json();
        if (me.preferred_lang) {
          syncWorkerLangFromProfile(me.preferred_lang);
        }
        setWorker(me);

        const orderRes = await fetch(`/api/orders/${orderId}`);
        if (!orderRes.ok) {
          setError('Order not found');
          return;
        }
        const orderData = await orderRes.json();

        if (
          orderData.assigned_worker_id &&
          orderData.assigned_worker_id !== me.worker_id &&
          orderData.locked_by !== me.worker_id
        ) {
          setError('This order is not yours');
          return;
        }

        if (orderData.assignment_type === 'overflow' && !orderData.assigned_worker_id) {
          setError('Claim this order from Available orders first');
          return;
        }

        if (orderData.status === 'PACKED') {
          setError('This order is already complete');
          return;
        }

        setOrder(orderData);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orderId, router]);

  function handleItemTap(item) {
    if (item.is_packed) return;
    setSelectedItem(item);
    speakProductName(item.products, lang);
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

  if (error) {
    return (
      <WorkerShell noPadding>
        <WorkerHeader title="Error" onBack={() => router.push('/worker/orders')} variant="white" />
        <div className="worker-content flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600 text-2xl font-bold">!</div>
          <p className="text-red-600 text-lg font-medium mb-6">{error}</p>
          <Button onClick={() => router.push('/worker/orders')}>Back to orders</Button>
        </div>
      </WorkerShell>
    );
  }

  if (orderComplete && order) {
    return (
      <div className="min-h-dvh bg-ppf-purple flex flex-col items-center justify-center text-white p-6 safe-top safe-bottom safe-x text-center">
        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-6">
          <IconCheck className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold mb-2">{getMessage('order_complete_title', lang)}</h1>
        <p className="text-xl opacity-90 mb-1">{order.order_id}</p>
        <p className="text-lg opacity-80 mb-1">{order.customer_name}</p>
        <p className="opacity-70 text-sm">Packed by: {worker?.full_name}</p>
        <Button
          variant="secondary"
          size="lg"
          className="mt-10 bg-white text-ppf-purple border-0"
          onClick={() => router.push('/worker/orders')}
        >
          Back to My Orders
        </Button>
      </div>
    );
  }

  const items = order?.order_items || [];
  const packedCount = items.filter((i) => i.is_packed).length;

  return (
    <WorkerShell noPadding>
      <WorkerHeader
        title={order.order_id}
        subtitle={`${order.customer_name} · ${order.total_weight_kg} kg`}
        onBack={() => router.push('/worker/orders')}
      />

      <div className="px-4 py-4 bg-white border-b border-gray-100">
        <ProgressBar
          value={packedCount}
          max={items.length}
          label={`${packedCount} of ${items.length} items packed`}
        />
      </div>

      <div className="worker-content pb-8">
        <PackingChecklist items={items} lang={lang} onItemTap={handleItemTap} />
      </div>

      {selectedItem && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedItem(null)} />
          <ProductConfirm
            product={selectedItem.products}
            quantity={selectedItem.quantity}
            unit={selectedItem.unit}
            lang={lang}
            onScan={() => router.push(`/worker/scan?itemId=${selectedItem.item_id}&orderId=${orderId}`)}
            onClose={() => setSelectedItem(null)}
          />
        </>
      )}
    </WorkerShell>
  );
}

export default function PackOrderPage() {
  return (
    <Suspense fallback={
      <WorkerShell noPadding>
        <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
      </WorkerShell>
    }>
      <PackOrderContent />
    </Suspense>
  );
}
