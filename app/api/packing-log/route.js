import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest } from '@/lib/auth';

export async function POST(request) {
  const worker = await getWorkerFromRequest(request);
  if (!worker) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const { error } = await supabaseAdmin.from('packing_log').insert({
    order_id: body.order_id,
    order_item_id: body.order_item_id,
    worker_id: worker.worker_id,
    product_id: body.product_id,
    action: body.action,
    scanned_qr: body.scanned_qr,
    expected_qr: body.expected_qr,
    match: body.match,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
