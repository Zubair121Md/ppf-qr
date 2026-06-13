import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest, requireStaff } from '@/lib/auth';
import { PRODUCT_ID_PATTERN } from '@/lib/constants';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get('ids') === 'true') {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('product_id')
      .eq('is_active', true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data.map((p) => p.product_id));
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('product_id, name_english, name_tamil, name_malayalam, name_hindi, image_url, category, unit, is_active')
    .eq('is_active', true)
    .order('product_id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request) {
  const worker = await getWorkerFromRequest(request);
  if (!requireStaff(worker)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { product_id, name_english, name_tamil, name_malayalam, name_hindi, image_url, category, unit } = body;

  if (!PRODUCT_ID_PATTERN.test(product_id)) {
    return NextResponse.json(
      { error: 'product_id must match pattern like STR-001' },
      { status: 400 }
    );
  }

  const qr_url = `${process.env.NEXT_PUBLIC_APP_URL}/p/${product_id}`;

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      product_id,
      name_english,
      name_tamil,
      name_malayalam,
      name_hindi,
      image_url,
      category,
      unit: unit || 'kg',
      qr_url,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
