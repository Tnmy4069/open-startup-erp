import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

// Paths that are always public (no session required)
const PUBLIC_PATHS = ['/', '/api/auth/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals, static assets, and PWA files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/sw.js' ||
    pathname === '/offline' ||
    pathname === '/manifest.webmanifest' ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/apple-icon') ||
    pathname.startsWith('/uploads/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Read & decrypt session cookie
  const token = request.cookies.get('cyberx_session')?.value;
  const session = token ? await decrypt(token) : null;

  const isPublic = 
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/public/') ||
    pathname.startsWith('/api/public/');
  const needsAuth = !isPublic;

  // Authenticated user visiting the login page (/) → send to dashboard
  if (isPublic && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Unauthenticated user trying to access protected route → send to login
  if (needsAuth && !session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Authenticated: inject user headers for API routes
  if (session) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', session.userId);
    requestHeaders.set('x-user-role', session.role);
    requestHeaders.set('x-username', session.username);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
