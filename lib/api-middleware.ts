import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { UserRole } from '@/lib/auth/roles';
import { isDevBypassEnabled, createDevSession } from '@/lib/dev-auth';

/**
 * API Middleware - Global Protection System
 *
 * Provides wrapper functions to protect API routes with authentication and role-based access control.
 *
 * Usage:
 * ```typescript
 * import { withAuth, withRole } from '@/lib/api-middleware';
 * import { UserRole } from '@/lib/auth/roles';
 *
 * // Require authentication only
 * export const GET = withAuth(async (request, session) => {
 *   // session.user is available
 *   return NextResponse.json({ data });
 * });
 *
 * // Require specific role
 * export const POST = withRole(UserRole.ADMIN, async (request, session) => {
 *   // Only ADMIN can access
 *   return NextResponse.json({ data });
 * });
 *
 * // Require minimum role level (STAFF or above)
 * export const PUT = withRole(UserRole.STAFF, async (request, session) => {
 *   // STAFF and ADMIN can access
 *   return NextResponse.json({ data });
 * });
 * ```

/**
 * Role hierarchy for access control
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.USER]: 0,
  [UserRole.STAFF]: 1,
  [UserRole.ADMIN]: 2,
};

/**
 * Check if user role meets minimum required role
 */
function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get user session with authentication check
 * Returns null if not authenticated
 * Supports dev bypass in development (env-var based, no cookies/endpoints)
 */
async function getSessionWithAuth() {
  // Dev bypass: pure env-var based, no cookies or endpoints
  if (isDevBypassEnabled()) {
    return createDevSession();
  }

  // Fall back to Better Auth
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

/**
 * Wrapper: Require authentication only
 *
 * @param handler - The route handler function
 * @returns Wrapped handler that requires authentication
 */
export function withAuth<T extends NextRequest, P = unknown>(
  handler: (request: T, session: { user: { id: string; email?: string; name?: string; role?: string } }, params?: P) => Promise<NextResponse>
) {
  return async (request: T, params?: P): Promise<NextResponse> => {
    try {
      const session = await getSessionWithAuth();

      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      return await handler(request, session, params);
    } catch (error) {
      console.error('[withAuth] Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrapper: Require specific role
 *
 * @param requiredRole - Minimum role level required
 * @param handler - The route handler function
 * @returns Wrapped handler that requires authentication and role
 */
export function withRole<T extends NextRequest, P = unknown>(
  requiredRole: UserRole,
  handler: (request: T, session: { user: { id: string; email?: string; name?: string; role?: string } }, params?: P) => Promise<NextResponse>
) {
  return async (request: T, params?: P): Promise<NextResponse> => {
    try {
      const session = await getSessionWithAuth();

      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

      if (!hasRequiredRole(userRole, requiredRole)) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }

      return await handler(request, session, params);
    } catch (error) {
      console.error('[withRole] Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrapper: Require ADMIN role only
 * Convenience function for admin-only endpoints
 */
export function withAdmin<T extends NextRequest, P = unknown>(
  handler: (request: T, session: { user: { id: string; email?: string; name?: string; role?: string } }, params?: P) => Promise<NextResponse>
) {
  return withRole(UserRole.ADMIN, handler);
}

/**
 * Wrapper: Require STAFF role or higher
 * Convenience function for staff/admin endpoints
 */
export function withStaff<T extends NextRequest, P = unknown>(
  handler: (request: T, session: { user: { id: string; email?: string; name?: string; role?: string } }, params?: P) => Promise<NextResponse>
) {
  return withRole(UserRole.STAFF, handler);
}

/**
 * Wrapper: Require ADMIN role for dynamic routes (with params)
 * For routes like /api/products/[id] that receive { params } as second argument
 */
export function withAdminDynamic<T extends NextRequest, P>(
  handler: (request: T, { params }: { params: P }, session: { user: { id: string; email?: string; name?: string; role?: string } }) => Promise<NextResponse>
) {
  return async (request: T, { params }: { params: P }): Promise<NextResponse> => {
    try {
      const session = await getSessionWithAuth();

      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

      if (!hasRequiredRole(userRole, UserRole.ADMIN)) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }

      return await handler(request, { params }, session);
    } catch (error) {
      console.error('[withAdminDynamic] Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrapper: Require STAFF role or higher for dynamic routes (with params)
 * For routes like /api/products/[id] that receive { params } as second argument
 */
export function withStaffDynamic<T extends NextRequest, P>(
  handler: (request: T, { params }: { params: P }, session: { user: { id: string; email?: string; name?: string; role?: string } }) => Promise<NextResponse>
) {
  return async (request: T, { params }: { params: P }): Promise<NextResponse> => {
    try {
      const session = await getSessionWithAuth();

      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

      if (!hasRequiredRole(userRole, UserRole.STAFF)) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }

      return await handler(request, { params }, session);
    } catch (error) {
      console.error('[withStaffDynamic] Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Optional: Public endpoint (no auth required)
 * 
 * Useful for:
 * - Health checks
 * - Public APIs
 * - Webhooks
 * 
 * @param handler - The route handler function
 * @returns Handler as-is (no wrapping)
 */
export function withPublic<T extends NextRequest>(
  handler: (request: T) => Promise<NextResponse>
) {
  return handler;
}
