'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Button from '@/components/ui/Button';
import { IconRefresh } from '@/components/ui/Icons';

export default function QRScanner({ onScan, scannerId = 'qr-reader', paused = false }) {
  const scannerRef = useRef(null);
  const lastScanRef = useRef(0);
  const [error, setError] = useState('');
  const [active, setActive] = useState(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        /* already stopped */
      }
      scannerRef.current = null;
    }
    setActive(false);
  }, []);

  const startScanner = useCallback(async () => {
    await stopScanner();
    setError('');

    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    const configs = [
      { facingMode: 'environment' },
      { facingMode: { exact: 'environment' } },
      true,
    ];

    const scanConfig = {
      fps: 10,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.75;
        return { width: Math.floor(size), height: Math.floor(size) };
      },
      aspectRatio: 1.0,
      disableFlip: false,
    };

    for (const camera of configs) {
      try {
        await scanner.start(
          camera,
          scanConfig,
          (decodedText) => {
            const now = Date.now();
            if (now - lastScanRef.current < 1500) return;
            lastScanRef.current = now;
            onScan(decodedText);
          },
          () => {}
        );
        setActive(true);
        return;
      } catch {
        /* try next camera config */
      }
    }

    setError('Camera not available. Use manual entry below or check browser permissions.');
  }, [onScan, scannerId, stopScanner]);

  useEffect(() => {
    if (paused) {
      stopScanner();
      return undefined;
    }

    startScanner();
    return () => {
      stopScanner();
    };
  }, [paused, startScanner, stopScanner]);

  return (
    <div className="w-full">
      <div id={scannerId} className="w-full min-h-[280px] rounded-2xl overflow-hidden bg-black" />

      {error && (
        <div className="mt-3 p-3 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-100 text-sm">
          {error}
        </div>
      )}

      <div className="mt-3 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-white border border-white/20"
          onClick={startScanner}
        >
          <IconRefresh className="w-4 h-4 mr-2" />
          {active ? 'Restart camera' : 'Start camera'}
        </Button>
      </div>
    </div>
  );
}
