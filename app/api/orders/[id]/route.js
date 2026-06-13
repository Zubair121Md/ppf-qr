import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest, requireStaff, verifyOrderOwnership } from '@/lib/auth';
import { OrderIdSchema } from '@/lib/validations';
import { syncOrderStatusFromItems } from '@/lib/order-sync';

export async function GET(request, { params }) {
  const worker = await getWorkerFromRequest(request);
  if (!worker) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orderIdResult = OrderIdSchema.safeParse(params.id);
  if (!orderIdResult.success) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (!requireStaff(worker)) {
    const owns = await verifyOrderOwnership(orderIdResult.data, worker.worker_id);
    if (!owns) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
  }

  await syncOrderStatusFromItems(orderIdResult.data);

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      order_items (
        item_id, product_id, quantity, unit, is_packed, packed_at, packed_by, scan_count,
        products (product_id, name_english, name_tamil, name_malayalam, name_hindi, image_url, category)
      )
    `)
    .eq('order_id', orderIdResult.data)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
