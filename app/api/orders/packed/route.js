import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest, requireStaff } from '@/lib/auth';

export async function GET(request) {
  const worker = await getWorkerFromRequest(request);
  if (!requireStaff(worker)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('order_id, customer_name, status, total_weight_kg, packed_at, packed_by')
    .in('status', ['PACKED', 'ERROR'])
    .order('packed_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const packerIds = [...new Set((orders || []).map((o) => o.packed_by).filter(Boolean))];
  let packerMap = {};

  if (packerIds.length > 0) {
    const { data: packers } = await supabaseAdmin
      .from('workers')
      .select('worker_id, full_name, username')
      .in('worker_id', packerIds);
    packerMap = Object.fromEntries((packers || []).map((p) => [p.worker_id, p]));
  }

  const result = (orders || []).map((o) => ({
    ...o,
    packer: packerMap[o.packed_by] || null,
  }));

  return NextResponse.json(result);
}
