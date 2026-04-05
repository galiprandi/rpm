/**
 * Better Auth Proxy for RPM Accesorios
 * 
 * Next.js 16+ proxy for route protection based on user roles
 * Replaces middleware.ts for Next.js 16 compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const DEBUG_COOKIE_NAME = 'rpm_debug_auth';

/**
 * Check if debug auth is enabled and valid
 * ONLY works in development with DEBUG_AUTH_ENABLED=true
 */
function isDebugAuthEnabled(request: NextRequest): { enabled: boolean; role?: string } {
  // Security: Only in development
  if (process.env.NODE_ENV === 'production') {
    return { enabled: false };
  }

  // Security: Only if explicitly enabled
  if (process.env.DEBUG_AUTH_ENABLED !== 'true') {
    return { enabled: false };
  }

  // Check debug cookie
  const debugCookie = request.cookies.get(DEBUG_COOKIE_NAME);
  if (!debugCookie?.value) {
    return { enabled: false };
  }

  try {
    const session = JSON.parse(debugCookie.value);
    const role = session?.user?.role;
    
    // Validate role
    if (!role || !['USER', 'STAFF', 'ADMIN'].includes(role)) {
      return { enabled: false };
    }

    return { enabled: true, role };
  } catch {
    return { enabled: false };
  }
}

/**
 * Check if role has access to /adm routes
 */
function hasAdmAccess(role: string | undefined): boolean {
  return role === 'STAFF' || role === 'ADMIN';
}

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
  
  // Check debug auth first (only in dev, only if enabled)
  const debugAuth = isDebugAuthEnabled(request);
  
  if (debugAuth.enabled && debugAuth.role) {
    // Public routes always allowed
    const publicRoutes = ['/', '/login', '/auth/error', '/api/health', '/api/health/db'];
    if (publicRoutes.includes(pathname)) {
      return NextResponse.next();
    }
    
    // Check access based on role
    if (pathname.startsWith('/adm/') || pathname.startsWith('/adm')) {
      if (hasAdmAccess(debugAuth.role)) {
        // Add debug headers for visibility
        const response = NextResponse.next();
        response.headers.set('x-debug-auth', 'true');
        response.headers.set('x-debug-role', debugAuth.role);
        return response;
      }
      // USER role trying to access /adm - redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Allow all other routes for authenticated debug users
    const response = NextResponse.next();
    response.headers.set('x-debug-auth', 'true');
    response.headers.set('x-debug-role', debugAuth.role);
    return response;
  }
  
  // Legacy DEBUG_AUTH support (bypass all - deprecated but kept for compatibility)
  if (process.env.DEBUG_AUTH === 'true') {
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
