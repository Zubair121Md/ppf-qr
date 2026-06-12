import { supabaseAdmin } from '@/lib/db';
import Image from 'next/image';
import QRDisplay from '@/components/shared/QRDisplay';

export default async function ProductPage({ params }) {
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('product_id', params.productId)
    .single();

  if (!product) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface">
        <p className="text-gray-500 text-lg">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-6 safe-top safe-bottom">
      <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-8 max-w-sm w-full text-center">
        {product.image_url && (
          <div className="relative w-40 h-40 mx-auto mb-4 rounded-2xl overflow-hidden">
            <Image src={product.image_url} alt={product.name_english} fill className="object-cover" />
          </div>
        )}
        <p className="text-sm font-mono text-gray-400 mb-1">{product.product_id}</p>
        <h1 className="text-2xl font-bold text-farm-green mb-1">{product.name_english}</h1>
        {product.category && (
          <p className="text-gray-500 text-sm mb-6">{product.category}</p>
        )}
        <div className="border-t border-gray-100 pt-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Product QR Code</p>
          <QRDisplay productId={product.product_id} size={220} />
        </div>
      </div>
    </div>
  );
}
