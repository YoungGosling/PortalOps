import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes (including NextAuth callback routes)
  const isAuthPage = pathname.startsWith('/signin') || pathname.startsWith('/signup');
  const isNextAuthCallback = pathname.startsWith('/api/auth');
  
  // Skip middleware for NextAuth API routes
  if (isNextAuthCallback) {
    return NextResponse.next();
  }
  
  // Check for NextAuth session using getToken (proper way)
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  // Check for traditional JWT token (for email/password login)
  const accessToken = request.cookies.get('access_token')?.value;

  // User is authenticated if they have either NextAuth token or access token
  const isAuthenticated = !!token || !!accessToken;

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is not authenticated and trying to access protected pages, redirect to signin
  if (!isAuthenticated && !isAuthPage) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Note: We handle API routes manually in the middleware function
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

