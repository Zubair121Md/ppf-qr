'use client';

import Image from 'next/image';
import { getProductName } from '@/lib/speech';

export default function PackingChecklist({ items, lang, onItemTap }) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const product = item.products;
        const name = getProductName(product, lang);
        const isPacked = item.is_packed;

        return (
          <button
            key={item.item_id}
            type="button"
            onClick={() => onItemTap(item)}
            disabled={isPacked}
            className={`
              w-full flex items-center gap-4 rounded-2xl border p-4 min-h-[88px] card-press
              ${isPacked
                ? 'bg-green-50 border-green-100 opacity-80'
                : 'bg-surface-card border-gray-100 shadow-card active:bg-gray-50'
              }
            `}
          >
            <div className="w-16 h-16 bg-surface-muted rounded-xl overflow-hidden flex-shrink-0 relative">
              {product?.image_url ? (
                <Image src={product.image_url} alt={name} fill className="object-cover" sizes="64px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🌿</div>
              )}
            </div>

            <div className="flex-1 text-left min-w-0">
              <p className="text-xl font-bold text-gray-900 leading-tight truncate">{name}</p>
              <p className="text-base text-gray-500 mt-1 font-medium">
                {item.quantity} {item.unit}
              </p>
            </div>

            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
              {isPacked ? (
                <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-bold">✓</span>
              ) : (
                <span className="w-8 h-8 rounded-full border-2 border-gray-300" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
