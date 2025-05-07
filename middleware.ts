import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const isPublicPath =
    path === '/' ||
    path === '/login' ||
    path.startsWith('/api/translate') ||
    path.startsWith('/api/auth') ||
    path === '/api/dev/reset-admin';

  const token = request.cookies.get('auth-token')?.value;

  if (isPublicPath && token) {
    if (path === '/' || path === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*', '/api/:path*'],
};