import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest, isStaffRole } from '@/lib/auth';

export async function GET(request, { params }) {
  const worker = await getWorkerFromRequest(request);
  if (!worker) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (worker.worker_id !== params.id && !isStaffRole(worker.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('qc_errors')
    .select(`
      *,
      orders (order_id, customer_name, packed_at, status),
      logged_by_worker:workers!qc_errors_logged_by_fkey (full_name)
    `)
    .eq('worker_id', params.id)
    .is('acknowledged_at', null)
    .order('logged_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
