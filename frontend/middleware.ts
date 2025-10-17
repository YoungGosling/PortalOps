import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { jwtDecode } from 'jwt-decode'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get NextAuth token
  const nextAuthToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Also check for legacy auth_token cookie for backwards compatibility
  const legacyToken = request.cookies.get('auth_token')?.value
  
  // Parse idToken as JWT and check expiration
  let isIdTokenExpired = false
  if (nextAuthToken?.idToken) {
    try {
      const decodedIdToken = jwtDecode(nextAuthToken.idToken as string)
      const currentTime = Math.floor(Date.now() / 1000)
      isIdTokenExpired = decodedIdToken.exp ? decodedIdToken.exp < currentTime : false
    } catch (error) {
      console.error('Failed to decode idToken:', error)
      isIdTokenExpired = true // Treat invalid token as expired
    }
  }

  // Clear cookies if token has error or is expired
  if (nextAuthToken?.error || isIdTokenExpired) {
    const res = NextResponse.next()
    request.cookies.getAll().forEach((cookie) => {
      res.cookies.delete(cookie.name)
    })
    return res
  }

  // Check if user is authenticated (either NextAuth or legacy token)
  const isAuthenticated = !!nextAuthToken || !!legacyToken
  
  // Public routes that don't require authentication
  const publicRoutes = ['/signin', '/signup', '/auth/error']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Protected routes
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/inbox') ||
                          pathname.startsWith('/services') ||
                          pathname.startsWith('/products') ||
                          pathname.startsWith('/users') ||
                          pathname.startsWith('/payment-register') ||
                          pathname.startsWith('/admin')
  
  // Redirect to signin if trying to access protected route without token
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL('/signin', request.url)
    return NextResponse.redirect(url)
  }
  
  // Redirect to dashboard if trying to access auth pages with valid token
  if (isPublicRoute && isAuthenticated && pathname !== '/auth/error') {
    const url = new URL('/dashboard', request.url)
    return NextResponse.redirect(url)
  }
  
  // Redirect root to appropriate page
  if (pathname === '/') {
    if (isAuthenticated) {
      const url = new URL('/dashboard', request.url)
      return NextResponse.redirect(url)
    } else {
      const url = new URL('/signin', request.url)
      return NextResponse.redirect(url)
    }
  }
  
  return NextResponse.next()
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
}

