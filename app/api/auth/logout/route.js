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
  const token = getTokenFromRequest(request);
  const decoded = token ? verifyToken(token) : null;
  const worker = await getWorkerFromRequest(request);
  const meta = getRequestMeta(request);

  if (decoded?.jti) {
    await revokeToken(decoded.jti, 'logout');
  }

  if (worker) {
    await logEvent({
      event_type: 'LOGOUT',
      actor_id: worker.worker_id,
      actor_role: worker.role,
      target_type: 'auth',
      ...meta,
    });
  }

  const response = NextResponse.json({ success: true });
  clearAuthCookie(response);
  return response;
}
