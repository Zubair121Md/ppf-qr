import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest, requireAdmin, hashPassword } from '@/lib/auth';

export async function GET(request, { params }) {
  const worker = await getWorkerFromRequest(request);
  if (!requireAdmin(worker)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('workers')
    .select('worker_id, username, full_name, preferred_lang, role, is_active, last_login_at')
    .eq('worker_id', params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request, { params }) {
  const worker = await getWorkerFromRequest(request);
  if (!requireAdmin(worker)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const updates = { ...body };
  delete updates.worker_id;

  if (updates.password) {
    updates.password_hash = await hashPassword(updates.password);
    delete updates.password;
  }

  const { data, error } = await supabaseAdmin
    .from('workers')
    .update(updates)
    .eq('worker_id', params.id)
    .select('worker_id, username, full_name, preferred_lang, role, is_active')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
