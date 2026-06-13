import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest, requireStaff } from '@/lib/auth';
import { getWorkerStats } from '@/lib/worker-stats';

export async function GET(request, { params }) {
  const staff = await getWorkerFromRequest(request);
  if (!requireStaff(staff)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);

  const { data: worker, error } = await supabaseAdmin
    .from('workers')
    .select('worker_id, username, full_name, preferred_lang, role, is_active, last_login_at, created_at')
    .eq('worker_id', params.id)
    .single();

  if (error || !worker) {
    return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
  }

  const stats = await getWorkerStats(params.id, { days });

  return NextResponse.json({ worker, ...stats, period_days: days });
}
