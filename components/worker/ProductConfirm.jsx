'use client';

import Image from 'next/image';
import Button from '@/components/ui/Button';
import AudioBanner from '@/components/shared/AudioBanner';
import { IconLeaf } from '@/components/ui/Icons';
import { getProductName } from '@/lib/speech';

export default function ProductConfirm({ product, quantity, unit, lang, onScan, onClose }) {
  const name = getProductName(product, lang);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-sheet safe-bottom max-h-[90dvh] overflow-y-auto">
      <div className="px-5 pt-3 pb-6">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        <div className="relative w-full aspect-[4/3] bg-surface-muted rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
          {product?.image_url ? (
            <Image src={product.image_url} alt={name} fill className="object-cover" sizes="100vw" priority />
          ) : (
            <IconLeaf className="w-16 h-16 text-gray-300" />
          )}
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-900 mb-1">{name}</h2>
        <p className="text-center font-mono text-sm text-gray-400 mb-1">{product?.product_id}</p>
        <p className="text-xl text-center text-gray-500 font-medium mb-4">
          {quantity} {unit}
        </p>

        <AudioBanner
          messageKey="tap_to_scan"
          lang={lang}
          replacements={{ product: name, quantity: String(quantity), unit }}
          className="mb-4"
          autoPlay
        />

        <div className="space-y-3">
          <Button size="xl" fullWidth onClick={onScan}>
            SCAN QR
          </Button>
          {onClose && (
            <Button variant="ghost" size="md" fullWidth onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
