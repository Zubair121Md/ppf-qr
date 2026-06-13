import { NextResponse } from 'next/server';
import { verifyTokenEdge } from './lib/jwt-edge';
import { rateLimit, getClientIp } from './lib/rate-limit';

const PUBLIC_PATHS = ['/worker/login', '/p'];
const STAFF_ROLES = ['manager', 'admin'];

function isStaff(user) {
  return user && STAFF_ROLES.includes(user.role);
}

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname === '/api/health') return true;
  return false;
}

function rateLimitResponse(retryAfter, limit) {
  return new NextResponse(JSON.stringify({ error: 'Too many attempts. Try again later.' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': '0',
    },
  });
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  if (pathname.startsWith('/api/auth/')) {
    const result = rateLimit({ identifier: ip, action: 'auth', maxRequests: 10, windowSeconds: 60 });
    if (!result.allowed) {
      return rateLimitResponse(result.retryAfter, 10);
    }
  } else if (pathname.startsWith('/api/') && !isPublicPath(pathname)) {
    const result = rateLimit({ identifier: ip, action: 'api', maxRequests: 200, windowSeconds: 60 });
    if (!result.allowed) {
      return rateLimitResponse(result.retryAfter, 200);
    }
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('farmscan_token')?.value;
  const user = token ? verifyTokenEdge(token) : null;

  if (pathname.startsWith('/admin')) {
    if (!isStaff(user)) {
      return NextResponse.redirect(new URL('/worker/login', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/worker') && pathname !== '/worker/login') {
    if (!user) {
      return NextResponse.redirect(new URL('/worker/login', request.url));
    }
    if (isStaff(user)) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/admin')) {
    if (!isStaff(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/worker',
    '/worker/:path*',
    '/api/:path*',
  ],
};
