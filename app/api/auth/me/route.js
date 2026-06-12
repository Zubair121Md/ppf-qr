import { NextResponse } from 'next/server';
import { getWorkerFromRequest } from '@/lib/auth';

export async function GET(request) {
  const worker = await getWorkerFromRequest(request);

  if (!worker) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    worker_id: worker.worker_id,
    username: worker.username,
    full_name: worker.full_name,
    role: worker.role,
    preferred_lang: worker.preferred_lang,
  });
}
