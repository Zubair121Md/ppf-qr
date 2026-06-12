import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getWorkerFromRequest, requireAdmin } from '@/lib/auth';

export async function GET(request) {
  const worker = await getWorkerFromRequest(request);
  if (!requireAdmin(worker)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const workerId = searchParams.get('worker_id');
  const date = searchParams.get('date');
  const unackedOnly = searchParams.get('unacked_only') === 'true';

  let query = supabaseAdmin
    .from('qc_errors')
    .select(`
      *,
      workers!qc_errors_worker_id_fkey (full_name, username),
      orders (order_id, customer_name, packed_at, status)
    `)
    .order('logged_at', { ascending: false });

  if (workerId) query = query.eq('worker_id', workerId);
  if (date) query = query.eq('shift_date', date);
  if (unackedOnly) query = query.is('acknowledged_at', null);

  const { data, error } = await query;

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

  const { order_id, error_code, error_note, photo_url } = await request.json();

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('order_id', order_id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status !== 'PACKED') {
    return NextResponse.json({ error: 'Can only log errors on packed orders' }, { status: 400 });
  }

  if (!order.packed_by) {
    return NextResponse.json({ error: 'Order has no packed_by worker' }, { status: 400 });
  }

  const shift_date = new Date().toISOString().split('T')[0];

  const { data, error } = await supabaseAdmin
    .from('qc_errors')
    .insert({
      order_id,
      worker_id: order.packed_by,
      logged_by: worker.worker_id,
      error_code,
      error_note,
      photo_url,
      shift_date,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabaseAdmin
    .from('orders')
    .update({ status: 'ERROR' })
    .eq('order_id', order_id);

  const { data: existingLoad } = await supabaseAdmin
    .from('worker_daily_load')
    .select('*')
    .eq('worker_id', order.packed_by)
    .eq('load_date', shift_date)
    .single();

  if (existingLoad) {
    await supabaseAdmin
      .from('worker_daily_load')
      .update({ error_count: Number(existingLoad.error_count) + 1 })
      .eq('id', existingLoad.id);
  } else {
    await supabaseAdmin.from('worker_daily_load').insert({
      worker_id: order.packed_by,
      load_date: shift_date,
      error_count: 1,
    });
  }

  return NextResponse.json(data, { status: 201 });
}
