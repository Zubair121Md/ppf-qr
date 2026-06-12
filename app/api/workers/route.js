import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest, requireAdmin, hashPassword } from '@/lib/auth';

export async function GET(request) {
  const worker = await getWorkerFromRequest(request);
  if (!requireAdmin(worker)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('workers')
    .select('worker_id, username, full_name, preferred_lang, role, is_active, last_login_at, created_at')
    .order('worker_id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request) {
  const worker = await getWorkerFromRequest(request);
  if (!requireAdmin(worker)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { worker_id, username, password, full_name, preferred_lang, role } = body;

  const password_hash = await hashPassword(password);

  const { data, error } = await supabaseAdmin
    .from('workers')
    .insert({
      worker_id,
      username,
      password_hash,
      full_name,
      preferred_lang: preferred_lang || 'english',
      role: role || 'worker',
    })
    .select('worker_id, username, full_name, preferred_lang, role, is_active')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
