import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/', '/login'];
const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/translate',
  '/api/ai/prompt',
  '/api/search',
  '/api/dev/reset-admin'
];

const BLOCKED_FOR_CLIENT = ['/dashboard/usage', '/dashboard/api-reference'];
const BLOCKED_FOR_CLIENT_AND_VIEWER = ['/dashboard/users', '/dashboard/settings'];

async function getUserFromToken(token: string | undefined) {
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;
  const isPublicPath = PUBLIC_PATHS.includes(pathname) || PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix));

  // Redirect logged-in users away from public pages
  if (token && isPublicPath && (pathname === '/' || pathname === '/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Block all non-public pages for unauthenticated users
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based route blocking
  if (token && (!isPublicPath)) {
    const user = await getUserFromToken(token);

    // Block for client only
    if (user?.role === 'client' && BLOCKED_FOR_CLIENT.some(path => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Block for client and viewer
    if (
      (user?.role === 'client' || user?.role === 'viewer') &&
      BLOCKED_FOR_CLIENT_AND_VIEWER.some(path => pathname.startsWith(path))
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/api/:path*'
  ],
};