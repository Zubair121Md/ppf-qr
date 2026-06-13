import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import {
  verifyPassword,
  signToken,
  setAuthCookie,
  revokeToken,
  verifyToken,
} from '@/lib/auth';
import { getMissingServerEnv, getJwtSecret } from '@/lib/env';
import { LoginSchema, parseBody, validationErrorResponse } from '@/lib/validations';
import { logEvent, getRequestMeta } from '@/lib/audit';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;
const ATTEMPT_WINDOW_MINUTES = 15;
const INVALID_CREDENTIALS = 'Invalid credentials';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn('JWT_SECRET should be at least 32 characters. Generate with: openssl rand -base64 32');
}

export async function POST(request) {
  try {
    const missingEnv = getMissingServerEnv();
    if (missingEnv.length) {
      return NextResponse.json(
        { error: 'Server misconfigured. Missing env vars on Vercel: ' + missingEnv.join(', ') },
        { status: 503 }
      );
    }

    getJwtSecret();

    const ip = getClientIp(request);
    const ipLimit = rateLimit({ identifier: ip, action: 'login_ip', maxRequests: 20, windowSeconds: 60 });
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = parseBody(LoginSchema, body);
    if (!parsed.success) {
      return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
    }

    const { username, password } = parsed.data;
    const meta = getRequestMeta(request);

    const { data: worker } = await supabaseAdmin
      .from('workers')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    const failLogin = async (reason) => {
      await logEvent({
        event_type: 'LOGIN_FAILED',
        actor_id: worker?.worker_id || null,
        actor_role: worker?.role || null,
        target_type: 'auth',
        ...meta,
        details: { username_attempted: username, reason },
        success: false,
      });
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    };

    if (!worker) {
      return failLogin('user_not_found');
    }

    if (worker.locked_until && new Date(worker.locked_until) > new Date()) {
      const minsLeft = Math.ceil((new Date(worker.locked_until) - Date.now()) / 60000);
      await logEvent({
        event_type: 'LOGIN_BLOCKED',
        actor_id: worker.worker_id,
        actor_role: worker.role,
        target_type: 'auth',
        ...meta,
        details: { minutes_remaining: minsLeft },
        success: false,
      });
      return NextResponse.json(
        { error: `Account locked. Try again in ${minsLeft} minute${minsLeft === 1 ? '' : 's'}.` },
        { status: 401 }
      );
    }

    const windowStart = new Date(Date.now() - ATTEMPT_WINDOW_MINUTES * 60 * 1000);
    let failedAttempts = worker.failed_attempts || 0;
    if (worker.last_attempt_at && new Date(worker.last_attempt_at) < windowStart) {
      failedAttempts = 0;
    }

    const valid = await verifyPassword(password, worker.password_hash);

    if (!valid) {
      failedAttempts += 1;
      const updates = {
        failed_attempts: failedAttempts,
        last_attempt_at: new Date().toISOString(),
      };

      if (failedAttempts >= MAX_ATTEMPTS) {
        updates.locked_until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
        await logEvent({
          event_type: 'ACCOUNT_LOCKED',
          actor_id: worker.worker_id,
          actor_role: worker.role,
          target_type: 'auth',
          ...meta,
          details: { username },
          success: false,
        });
      }

      await supabaseAdmin.from('workers').update(updates).eq('worker_id', worker.worker_id);
      return failLogin('wrong_password');
    }

    await supabaseAdmin
      .from('workers')
      .update({
        failed_attempts: 0,
        locked_until: null,
        last_attempt_at: null,
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

    setAuthCookie(response, token, worker.role);

    await logEvent({
      event_type: 'LOGIN_SUCCESS',
      actor_id: worker.worker_id,
      actor_role: worker.role,
      target_type: 'auth',
      ...meta,
      details: { role: worker.role },
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
