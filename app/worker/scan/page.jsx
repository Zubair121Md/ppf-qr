'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import QRScanner from '@/components/worker/QRScanner';
import ManualProductEntry from '@/components/worker/ManualProductEntry';
import AudioBanner from '@/components/shared/AudioBanner';
import Spinner from '@/components/ui/Spinner';
import { IconLeaf } from '@/components/ui/Icons';
import { fetchWithRetry } from '@/lib/fetch-retry';
import {
  getWorkerLang,
  getProductName,
  speakMessage,
  getMessage,
  extractProductIdFromScan,
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
  const [resultAudio, setResultAudio] = useState(null);

  useEffect(() => {
    async function load() {
      if (!orderId || !itemId) return;
      const res = await fetchWithRetry(`/api/orders/${orderId}`);
      if (res.ok) {
        const order = await res.json();
        const found = order.order_items?.find((i) => String(i.item_id) === itemId);
        setItem(found);
      }
    }
    load();
  }, [orderId, itemId]);

  const processScan = useCallback(async (rawValue) => {
    if (processing || !item) return;
    setProcessing(true);
    setScanError('');

    const scannedProductId = extractProductIdFromScan(rawValue);
    const expectedProductId = (item.product_id || '').trim().toUpperCase();
    const productName = getProductName(item.products, lang);
    const expectedName = getProductName(item.products, lang);

    if (scannedProductId === expectedProductId) {
      setFlash('green');
      setResultAudio({ key: 'scan_correct', replacements: { product: productName } });
      speakMessage('scan_correct', lang, { product: productName });

      const packRes = await fetchWithRetry(`/api/order-items/${itemId}/pack`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SCAN_CORRECT',
          scanned_qr: rawValue,
          expected_qr: expectedProductId,
          match: true,
        }),
      });
      const packData = packRes.ok ? await packRes.json() : {};

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
      setResultAudio({ key: 'scan_wrong', replacements: { product: expectedName } });
      speakMessage('scan_wrong', lang, { product: expectedName });
      setScanError(getMessage('scan_wrong', lang, { product: expectedName }));

      await fetchWithRetry('/api/packing-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          order_item_id: itemId,
          product_id: expectedProductId,
          action: 'SCAN_WRONG',
          scanned_qr: rawValue,
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

      <header className="px-4 pt-2 pb-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => router.push(`/worker/pack/${orderId}`)}
          className="touch-target text-white/80 text-sm mb-3 -ml-2 min-h-0 h-10 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex items-center gap-4 bg-white/10 rounded-2xl p-4 backdrop-blur-sm mb-3">
          <div className="w-16 h-16 bg-white/10 rounded-xl overflow-hidden relative flex-shrink-0 flex items-center justify-center">
            {item.products?.image_url ? (
              <Image src={item.products.image_url} alt={productName} fill className="object-cover" sizes="64px" />
            ) : (
              <IconLeaf className="w-8 h-8 text-white/50" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white/60 uppercase tracking-wide mb-0.5">Scan this product</p>
            <p className="text-xl font-bold truncate">{productName}</p>
            <p className="text-white/70 font-medium">{item.quantity} {item.unit}</p>
            <p className="text-xs font-mono text-white/50 mt-1">{item.product_id}</p>
          </div>
        </div>

        <AudioBanner
          messageKey={resultAudio?.key || 'scan_prompt'}
          lang={lang}
          replacements={resultAudio?.replacements || { product: productName }}
          variant={resultAudio?.key === 'scan_wrong' ? 'error' : 'dark'}
          autoPlay={!resultAudio || resultAudio.key !== 'scan_correct'}
          className={resultAudio?.key === 'scan_correct' ? 'opacity-0 h-0 p-0 overflow-hidden' : ''}
        />
      </header>

      <div className="flex-1 relative min-h-0 px-4">
        <QRScanner onScan={processScan} scannerId="farmscan-qr" paused={processing} />
      </div>

      <div className="px-4 pb-4 flex-shrink-0">
        <ManualProductEntry
          expectedProductId={item.product_id}
          lang={lang}
          onSubmit={processScan}
        />
      </div>

      {scanError && (
        <div className="fixed bottom-0 inset-x-0 z-40 safe-bottom px-4 pb-4">
          <div className="bg-red-600 rounded-2xl p-4 shadow-lg text-white">
            <p className="font-medium text-center">{scanError}</p>
            <button
              type="button"
              onClick={() => speakMessage('scan_wrong', lang, { product: productName })}
              className="mt-2 w-full text-sm py-2 rounded-lg bg-white/20 font-semibold"
            >
              Replay audio
            </button>
            {wrongCount >= 3 && (
              <p className="font-bold mt-2 text-red-100 text-center text-sm">Call your supervisor</p>
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
