'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import QRScanner from '@/components/worker/QRScanner';
import Spinner from '@/components/ui/Spinner';
import {
  getWorkerLang,
  getProductName,
  speakProductName,
  speakMessage,
  getMessage,
} from '@/lib/speech';

function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get('itemId');
  const orderId = searchParams.get('orderId');
  const lang = getWorkerLang();

  const [item, setItem] = useState(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [flash, setFlash] = useState(null);
  const [scanError, setScanError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function load() {
      if (!orderId || !itemId) return;
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const order = await res.json();
        const found = order.order_items?.find((i) => String(i.item_id) === itemId);
        setItem(found);
        if (found?.products) {
          speakProductName(found.products, lang);
        }
      }
    }
    load();
  }, [orderId, itemId, lang]);

  const handleScan = useCallback(async (scannedValue) => {
    if (processing || !item) return;
    setProcessing(true);
    setScanError('');

    const scannedProductId = scannedValue.includes('/p/')
      ? scannedValue.split('/p/')[1]?.split(/[?#]/)[0]
      : scannedValue;

    const expectedProductId = item.product_id;
    const productName = getProductName(item.products, lang);
    const expectedName = getProductName(item.products, lang);

    if (scannedProductId === expectedProductId) {
      setFlash('green');

      const packRes = await fetch(`/api/order-items/${itemId}/pack`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SCAN_CORRECT',
          scanned_qr: scannedValue,
          expected_qr: expectedProductId,
          match: true,
        }),
      });
      const packData = packRes.ok ? await packRes.json() : {};

      speakMessage('scan_correct', lang, { product: productName });

      setTimeout(() => {
        if (packData.orderComplete) {
          router.push(`/worker/pack/${orderId}?complete=true`);
        } else {
          router.push(`/worker/pack/${orderId}`);
        }
      }, 600);
    } else {
      setFlash('red');
      setWrongCount((c) => c + 1);
      speakMessage('scan_wrong', lang, { product: expectedName });
      setScanError(getMessage('scan_wrong', lang, { product: expectedName }));

      await fetch('/api/packing-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          order_item_id: itemId,
          product_id: expectedProductId,
          action: 'SCAN_WRONG',
          scanned_qr: scannedValue,
          expected_qr: expectedProductId,
          match: false,
        }),
      }).catch(() => {});

      setTimeout(() => {
        setFlash(null);
        setProcessing(false);
      }, 800);
    }
  }, [processing, item, itemId, orderId, lang, router]);

  if (!item) {
    return (
      <div className="min-h-dvh bg-gray-900 flex items-center justify-center">
        <Spinner size="lg" className="[&>div]:border-white/20 [&>div]:border-t-white" />
      </div>
    );
  }

  const productName = getProductName(item.products, lang);

  return (
    <div className="min-h-dvh bg-gray-900 text-white flex flex-col safe-top safe-bottom safe-x">
      {flash && (
        <div
          className={`fixed inset-0 z-50 pointer-events-none transition-opacity ${
            flash === 'green' ? 'bg-green-500/70' : 'bg-red-500/70'
          }`}
        />
      )}

      <header className="px-4 pt-2 pb-4 flex-shrink-0">
        <button
          type="button"
          onClick={() => router.push(`/worker/pack/${orderId}`)}
          className="touch-target text-white/80 text-sm mb-3 -ml-2 min-h-0 h-10"
        >
          ← Back
        </button>

        <div className="flex items-center gap-4 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
          <div className="w-16 h-16 bg-white/10 rounded-xl overflow-hidden relative flex-shrink-0">
            {item.products?.image_url ? (
              <Image src={item.products.image_url} alt={productName} fill className="object-cover" sizes="64px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🌿</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white/60 uppercase tracking-wide mb-0.5">Scan this product</p>
            <p className="text-xl font-bold truncate">{productName}</p>
            <p className="text-white/70 font-medium">{item.quantity} {item.unit}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 relative min-h-0 px-2">
        <div className="absolute inset-0 overflow-hidden rounded-2xl mx-2 mb-2">
          <QRScanner onScan={handleScan} scannerId="farmscan-qr" />
        </div>

        {/* Viewfinder overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center mx-2 mb-2">
          <div className="w-64 h-64 border-2 border-white/50 rounded-2xl" />
        </div>
      </div>

      <div className="px-4 pb-4 flex-shrink-0">
        <p className="text-center text-white/60 text-sm">
          Point camera at the product QR label
        </p>
      </div>

      {scanError && (
        <div className="fixed bottom-0 inset-x-0 z-40 safe-bottom">
          <div className="mx-4 mb-4 bg-red-600 rounded-2xl p-4 text-center shadow-lg">
            <p className="font-medium">{scanError}</p>
            {wrongCount >= 3 && (
              <p className="font-bold mt-2 text-red-100">Call your supervisor</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-gray-900 flex items-center justify-center">
        <Spinner size="lg" className="[&>div]:border-white/20 [&>div]:border-t-white" />
      </div>
    }>
      <ScanContent />
    </Suspense>
  );
}
