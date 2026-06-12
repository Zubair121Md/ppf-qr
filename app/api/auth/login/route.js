import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';
import { getMissingServerEnv } from '@/lib/env';

export async function POST(request) {
  try {
    const missingEnv = getMissingServerEnv();
    if (missingEnv.length) {
      console.error('Login blocked — missing env:', missingEnv.join(', '));
      return NextResponse.json(
        {
          error: 'Server misconfigured. Missing env vars on Vercel: ' + missingEnv.join(', '),
        },
        { status: 503 }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const { data: worker, error } = await supabaseAdmin
      .from('workers')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !worker) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    if (worker.locked_until && new Date(worker.locked_until) > new Date()) {
      return NextResponse.json({ error: 'Account locked. Try again later.' }, { status: 401 });
    }

    const valid = await verifyPassword(password, worker.password_hash);

    if (!valid) {
      const failedAttempts = (worker.failed_attempts || 0) + 1;
      const updates = { failed_attempts: failedAttempts };

      if (failedAttempts >= 5) {
        updates.locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      }

      await supabaseAdmin.from('workers').update(updates).eq('worker_id', worker.worker_id);

      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    await supabaseAdmin
      .from('workers')
      .update({
        failed_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
      })
      .eq('worker_id', worker.worker_id);

    await supabaseAdmin.from('packing_log').insert({
      worker_id: worker.worker_id,
      action: 'LOGIN',
    });

    const tokenPayload = {
      worker_id: worker.worker_id,
      username: worker.username,
      full_name: worker.full_name,
      role: worker.role,
      preferred_lang: worker.preferred_lang,
    };

    const token = signToken(tokenPayload);
    const response = NextResponse.json({
      worker_id: worker.worker_id,
      username: worker.username,
      full_name: worker.full_name,
      role: worker.role,
      preferred_lang: worker.preferred_lang,
    });

    setAuthCookie(response, token);
    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
