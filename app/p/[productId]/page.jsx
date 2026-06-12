import { supabaseAdmin } from '@/lib/db';
import Image from 'next/image';

export default async function ProductPage({ params }) {
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('product_id', params.productId)
    .single();

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        {product.image_url && (
          <div className="relative w-48 h-48 mx-auto mb-4 rounded-xl overflow-hidden">
            <Image src={product.image_url} alt={product.name_english} fill className="object-cover" />
          </div>
        )}
        <p className="text-sm text-gray-500 mb-1">{product.product_id}</p>
        <h1 className="text-2xl font-bold text-farm-green">{product.name_english}</h1>
        {product.category && (
          <p className="text-gray-500 mt-2">{product.category}</p>
        )}
      </div>
    </div>
  );
}
