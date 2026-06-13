import { NextResponse } from 'next/server';
import { getWorkerFromRequest, requireStaff } from '@/lib/auth';
import { getAllWorkersPerformance } from '@/lib/worker-stats';

export async function GET(request) {
  const worker = await getWorkerFromRequest(request);
  if (!requireStaff(worker)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '7', 10);

  const data = await getAllWorkersPerformance({ days });
  return NextResponse.json(data);
}
