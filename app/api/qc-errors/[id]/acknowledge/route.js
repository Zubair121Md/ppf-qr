import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const worker = await getWorkerFromRequest(request);
  if (!worker) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const errorId = parseInt(params.id, 10);

  const { data: qcError } = await supabaseAdmin
    .from('qc_errors')
    .select('*')
    .eq('error_id', errorId)
    .single();

  if (!qcError) {
    return NextResponse.json({ error: 'Error not found' }, { status: 404 });
  }

  if (qcError.worker_id !== worker.worker_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('qc_errors')
    .update({ acknowledged_at: new Date().toISOString() })
    .eq('error_id', errorId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
