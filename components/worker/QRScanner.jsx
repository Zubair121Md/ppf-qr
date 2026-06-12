'use client';

import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, scannerId = 'qr-reader' }) {
  const scannerRef = useRef(null);
  const runningRef = useRef(false);

  useEffect(() => {
    let scanner;

    async function start() {
      if (runningRef.current) return;
      scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;
      runningRef.current = true;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          (decodedText) => {
            onScan(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error('Scanner error:', err);
      }
    }

    start();

    return () => {
      if (scannerRef.current && runningRef.current) {
        scannerRef.current.stop().catch(() => {});
        runningRef.current = false;
      }
    };
  }, [onScan, scannerId]);

  return <div id={scannerId} className="w-full" />;
}
