import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest, requireAdmin } from '@/lib/auth';
import { distributeOrders } from '@/lib/distribute';

export async function POST(request) {
  const worker = await getWorkerFromRequest(request);
  if (!requireAdmin(worker)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('order_id, total_weight_kg, status')
    .in('status', ['PENDING', 'ASSIGNED'])
    .gte('created_at', `${today}T00:00:00`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: workers } = await supabaseAdmin
    .from('workers')
    .select('worker_id, full_name')
    .eq('role', 'worker')
    .eq('is_active', true);

  const distribution = distributeOrders(orders || [], workers || []);

  for (const d of distribution) {
    await supabaseAdmin
      .from('orders')
      .update({
        assigned_worker_id: d.assigned_worker_id,
        assignment_type: d.assignment_type,
        parent_order_id: d.parent_order_id,
        status: d.assigned_worker_id ? 'ASSIGNED' : 'PENDING',
      })
      .eq('order_id', d.order_id);
  }

  return NextResponse.json({ redistributed: distribution.length, distribution });
}
