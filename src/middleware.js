import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login', '/setup', '/api/login', '/api/setup', '/api/setup/status'];
const PUBLIC_EXACT = ['/']; // Root page handles its own routing
const AUTH_PAGES = ['/login', '/setup'];
const ADMIN_PATHS = ['/admin', '/api/admin'];

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production'
);

async function verifyTokenEdge(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Block path traversal
  if (pathname.includes('..') || pathname.includes('\\') || pathname.includes('\0')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // ─── Public paths ───────────────────────────────────────
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isPublicExact = PUBLIC_EXACT.includes(pathname);

  if (isPublicPath || isPublicExact) {
    if (token && AUTH_PAGES.includes(pathname)) {
      const decoded = await verifyTokenEdge(token);
      if (decoded) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // ─── /register is ALWAYS blocked ────────────────────────
  if (pathname === '/register' || pathname === '/api/register') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ─── All routes below require valid token ───────────────
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    // Only pass safe internal paths as redirect (no query strings, no external URLs)
    const safePath = pathname.replace(/[^a-zA-Z0-9\-\/]/g, '');
    if (safePath && safePath.startsWith('/') && !safePath.startsWith('//')) {
      loginUrl.searchParams.set('redirect', safePath);
    }
    return NextResponse.redirect(loginUrl);
  }

  const decoded = await verifyTokenEdge(token);

  if (!decoded) {
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
      response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
      return response;
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    return response;
  }

  // ─── Admin-only routes ──────────────────────────────────
  const isAdminPath = ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isAdminPath && decoded.role !== 'admin') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ─── Inject user info ──────────────────────────────────
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', decoded.userId);
  requestHeaders.set('x-user-email', decoded.email);
  requestHeaders.set('x-user-role', decoded.role || 'user');

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
