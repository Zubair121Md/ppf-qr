import { NextResponse } from 'next/server';
import { getMissingServerEnv } from '@/lib/env';
import { supabaseAdmin } from '@/lib/db';

export async function GET() {
  const missing = getMissingServerEnv();

  if (missing.length) {
    return NextResponse.json({
      ok: false,
      missing_env: missing,
      hint: 'Add all vars in Vercel → Settings → Environment Variables, then redeploy.',
    }, { status: 503 });
  }

  try {
    const { error } = await supabaseAdmin.from('workers').select('worker_id').limit(1);
    if (error) {
      return NextResponse.json({
        ok: false,
        db: 'error',
        message: error.message,
      }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      db: 'connected',
      app_url: process.env.NEXT_PUBLIC_APP_URL || '(not set)',
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      message: err.message,
    }, { status: 503 });
  }
}
