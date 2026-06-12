'use client';

import Badge from '@/components/ui/Badge';
import { getProductName } from '@/lib/speech';

export default function OrderCard({ order, lang, onClick }) {
  const items = order.order_items || [];
  const packedCount = items.filter((i) => i.is_packed).length;
  const productList = items
    .map((i) => {
      const name = getProductName(i.products, lang);
      return `${i.quantity}${i.unit === 'kg' ? 'kg' : ` ${i.unit}`} ${name}`;
    })
    .join(', ');

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-surface-card rounded-2xl border border-gray-100 p-4 shadow-card card-press min-h-[88px]"
    >
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-lg text-gray-900 truncate">{order.customer_name}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{order.order_id}</p>
        </div>
        <Badge status={order.status}>{order.status}</Badge>
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span className="font-medium">{items.length} items</span>
        <span className="text-gray-300">·</span>
        <span className="font-medium">{order.total_weight_kg} kg</span>
        {packedCount > 0 && (
          <>
            <span className="text-gray-300">·</span>
            <span className="text-farm-green font-medium">{packedCount}/{items.length} done</span>
          </>
        )}
      </div>

      {productList && (
        <p className="text-sm text-gray-400 mt-2 line-clamp-2 leading-snug">{productList}</p>
      )}
    </button>
  );
}
