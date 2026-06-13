import { NextResponse } from 'next/server';
import {
  clearAuthCookie,
  getTokenFromRequest,
  verifyToken,
  revokeToken,
  getWorkerFromRequest,
} from '@/lib/auth';
import { logEvent, getRequestMeta } from '@/lib/audit';

export async function POST(request) {
  const response = NextResponse.json({ success: true });

  try {
    const token = getTokenFromRequest(request);
    const decoded = token ? verifyToken(token) : null;

    if (decoded?.jti) {
      await revokeToken(decoded.jti, 'logout');
    }

    const worker = await getWorkerFromRequest(request);
    if (worker) {
      const meta = getRequestMeta(request);
      await logEvent({
        event_type: 'LOGOUT',
        actor_id: worker.worker_id,
        actor_role: worker.role,
        target_type: 'auth',
        ip_address: meta.ip_address,
        user_agent: meta.user_agent,
      });
    }
  } catch (err) {
    console.error('Logout error (cookie still cleared):', err?.message || err);
  }

  clearAuthCookie(response);
  return response;
}
