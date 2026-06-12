'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import {
  getWorkerLang,
  getMessage,
  speakMessage,
  getErrorMessageKey,
} from '@/lib/speech';

export default function FeedbackAlert({ errors, onAllAcknowledged }) {
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const lang = getWorkerLang();
  const error = errors[index];

  useEffect(() => {
    if (!error) return;

    speakMessage('feedback_error', lang);
    const timer = setTimeout(() => {
      const key = getErrorMessageKey(error.error_code);
      speakMessage(key, lang);
    }, 2000);

    return () => clearTimeout(timer);
  }, [error, lang]);

  if (!error) return null;

  async function handleAcknowledge() {
    setLoading(true);
    try {
      await fetch(`/api/qc-errors/${error.error_id}/acknowledge`, { method: 'PATCH' });

      if (index < errors.length - 1) {
        setIndex(index + 1);
      } else {
        onAllAcknowledged();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-red-950/90 flex items-end sm:items-center justify-center safe-top safe-bottom safe-x">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">⚠️</span>
          <h2 className="text-xl font-bold text-red-700">
            {getMessage('feedback_header', lang)}
          </h2>
        </div>

        <div className="space-y-3 mb-6 bg-red-50 rounded-2xl p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Order</span>
            <span className="font-mono font-medium">{error.order_id}</span>
          </div>
          {error.orders?.packed_at && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Packed on</span>
              <span>{new Date(error.orders.packed_at).toLocaleDateString()}</span>
            </div>
          )}
          <p className="text-red-700 font-semibold text-base pt-2 border-t border-red-100">
            {getMessage(getErrorMessageKey(error.error_code), lang)}
          </p>
          {error.error_note && (
            <p className="bg-white p-3 rounded-xl text-gray-700 text-sm leading-relaxed">
              {error.error_note}
            </p>
          )}
          {error.photo_url && (
            <img
              src={error.photo_url}
              alt="Error evidence"
              className="w-full rounded-xl cursor-pointer"
              onClick={() => window.open(error.photo_url, '_blank')}
            />
          )}
        </div>

        <Button size="lg" fullWidth onClick={handleAcknowledge} disabled={loading}>
          {loading ? '...' : getMessage('i_understand', lang)}
        </Button>

        {errors.length > 1 && (
          <p className="text-center text-sm text-gray-400 mt-3">
            {index + 1} of {errors.length}
          </p>
        )}
      </div>
    </div>
  );
}
