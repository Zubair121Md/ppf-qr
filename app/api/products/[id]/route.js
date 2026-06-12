import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest, requireAdmin } from '@/lib/auth';

export async function GET(request, { params }) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('product_id', params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request, { params }) {
  const worker = await getWorkerFromRequest(request);
  if (!requireAdmin(worker)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  delete body.product_id;
  body.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(body)
    .eq('product_id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const worker = await getWorkerFromRequest(request);
  if (!requireAdmin(worker)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('product_id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
