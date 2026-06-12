'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function QRDisplay({ productId, size = 200, showLabel = true, className = '' }) {
  const [dataUrl, setDataUrl] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!productId) return;

    const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const qrUrl = `${base}/p/${productId}`;
    setUrl(qrUrl);

    QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H',
      width: size,
      margin: 2,
      color: { dark: '#1B5E20', light: '#FFFFFF' },
    }).then(setDataUrl).catch(() => {});
  }, [productId, size]);

  if (!dataUrl) {
    return (
      <div
        className={`bg-gray-100 animate-pulse rounded-xl ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-card">
        <img
          src={dataUrl}
          alt={`QR code for ${productId}`}
          width={size}
          height={size}
          className="block"
        />
      </div>
      {showLabel && (
        <div className="mt-2 text-center">
          <p className="font-mono text-sm font-bold text-gray-800">{productId}</p>
          <p className="text-xs text-gray-400 mt-0.5 break-all max-w-[200px]">{url}</p>
        </div>
      )}
    </div>
  );
}
