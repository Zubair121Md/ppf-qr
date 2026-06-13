import { NextResponse } from 'next/server';
import { getWorkerFromRequest } from '@/lib/auth';
import { getWorkerStats } from '@/lib/worker-stats';

export async function GET(request) {
  const worker = await getWorkerFromRequest(request);
  if (!worker) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (worker.role !== 'worker') {
    return NextResponse.json({ error: 'Workers only' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);

  const stats = await getWorkerStats(worker.worker_id, { days });
  return NextResponse.json({
    ...stats,
    worker: {
      worker_id: worker.worker_id,
      full_name: worker.full_name,
      username: worker.username,
    },
  });
}
