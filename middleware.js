import { NextResponse } from 'next/server';
import { verifyTokenEdge } from './lib/jwt-edge';

const PUBLIC_PATHS = ['/worker/login', '/p'];

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  if (pathname.startsWith('/api/auth')) return true;
  return false;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('farmscan_token')?.value;
  const user = token ? verifyTokenEdge(token) : null;

  if (pathname.startsWith('/admin')) {
    if (!user || user.role !== 'admin') {
      return NextResponse.redirect(new URL('/worker/login', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/worker') && pathname !== '/worker/login') {
    if (!user) {
      return NextResponse.redirect(new URL('/worker/login', request.url));
    }
    if (user.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/admin')) {
    if (!user || user.role !== 'admin') {
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
    '/api/admin/:path*',
  ],
};
