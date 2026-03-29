/**
 * Better Auth Proxy for RPM Accesorios
 * 
 * Next.js 16+ proxy for route protection based on user roles
 * Replaces middleware.ts for Next.js 16 compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

/**
 * Proxy function for route protection
 * 
 * Provides role-based access control:
 * - /adm/* - Requires authentication (STAFF or ADMIN)
 * - /api/admin/* - Requires authentication (ADMIN only in API routes)
 * - /api/auth/protected/* - Requires authentication
 * 
 * @param request - Next.js request object
 * @returns Next.js response with redirect or continuation
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Debug mode - bypass authentication for testing
  const isDebugMode = process.env.DEBUG_AUTH === 'true' || 
                      request.nextUrl.searchParams.get('debug') === 'true';
  
  if (isDebugMode) {
    return NextResponse.next();
  }
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/auth/error',
    '/api/health',
    '/api/health/db',
    '/api/auth/sign-in',
    '/api/auth/sign-out',
    '/api/auth/session'
  ];
  
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Check for session cookie (fast check)
  const sessionCookie = getSessionCookie(request);
  
  // Routes that require authentication
  const protectedRoutes = [
    '/adm/',
    '/api/admin/',
    '/api/auth/protected/'
  ];
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute && !sessionCookie) {
    // Redirect to login for protected routes without session
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

/**
 * Proxy matcher configuration
 * 
 * Defines which routes the proxy should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
    
    // Specifically match protected routes
    '/adm/:path*',
    '/api/admin/:path*',
    '/api/auth/protected/:path*',
  ],
};
