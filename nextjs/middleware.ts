import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isTokenValid } from '@/lib/jwt';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  const { pathname } = request.nextUrl;

  // Public routes
  const isAuthPage = pathname.startsWith('/signin') || pathname.startsWith('/signup');

  // Verify if token is valid and not expired
  const hasValidToken = isTokenValid(token);

  // If user has valid token and trying to access auth pages, redirect to dashboard
  if (hasValidToken && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user doesn't have valid token (missing or expired) and trying to access protected pages, redirect to signin
  if (!hasValidToken && !isAuthPage) {
    // Clear the expired token cookie
    const response = NextResponse.redirect(new URL('/signin', request.url));
    response.cookies.set('access_token', '', {
      path: '/',
      expires: new Date(0),
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

