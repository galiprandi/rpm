/**
 * Server-side authentication helpers
 * 
 * Use these functions in Server Components and API routes
 * to validate sessions and check user roles
 */

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import { UserRole } from './auth/roles';

// Environment-based admin emails (comma-separated)
const getAdminEmailsFromEnv = (): string[] => {
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails) return [];
  return adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
};

const DEBUG_COOKIE_NAME = 'rpm_debug_auth';

/**
 * Check if debug auth is enabled
 */
function isDebugAuthEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.DEBUG_AUTH_ENABLED === 'true'
  );
}

/**
 * Get debug session from cookie
 * Only available in development when DEBUG_AUTH_ENABLED=true
 */
async function getDebugSession() {
  if (!isDebugAuthEnabled()) {
    return null;
  }

  try {
    const cookieStore = await cookies();
    const debugCookie = cookieStore.get(DEBUG_COOKIE_NAME);

    if (!debugCookie?.value) {
      // Create default debug session if none exists
      const defaultRole = (process.env.DEBUG_AUTH_DEFAULT_ROLE as UserRole) || UserRole.USER;
      if (Object.values(UserRole).includes(defaultRole)) {
        return createDebugSession(defaultRole);
      }
      return null;
    }

    const session = JSON.parse(debugCookie.value);
    return session;
  } catch {
    return null;
  }
}

/**
 * Create a mock debug session
 */
function createDebugSession(role: UserRole) {
  const timestamp = Date.now();
  return {
    user: {
      id: `debug-${role.toLowerCase()}-${timestamp}`,
      name: `Debug ${role}`,
      email: `debug-${role.toLowerCase()}@rpm.local`,
      image: null,
      role: role,
    },
    session: {
      id: `debug-session-${timestamp}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000),
      userId: `debug-${role.toLowerCase()}-${timestamp}`,
    },
  };
}

/**
 * Get current session from server context
 * Use this in Server Components and API routes
 * 
 * In development with DEBUG_AUTH_ENABLED=true, returns debug session
 * In production or without debug enabled, returns real Better Auth session
 * with role override from ADMIN_EMAILS
 */
export async function getSession() {
  // Try debug session first (only in development)
  const debugSession = await getDebugSession();
  if (debugSession) {
    // Apply ADMIN_EMAILS override to debug session too
    const userEmail = debugSession.user.email;
    const adminEmails = getAdminEmailsFromEnv();
    
    if (userEmail && adminEmails.includes(userEmail.toLowerCase())) {
      (debugSession.user as { role: string }).role = 'ADMIN';
    }
    
    return debugSession;
  }

  // Fall back to real Better Auth session
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  
  // Override role based on ADMIN_EMAILS environment variable
  if (session?.user) {
    const userEmail = (session.user as { email?: string }).email;
    const adminEmails = getAdminEmailsFromEnv();
    
    if (userEmail && adminEmails.includes(userEmail.toLowerCase())) {
      (session.user as { role: string }).role = 'ADMIN';
    }
  }
  
  return session;
}

/**
 * Require authentication - throws if not authenticated
 * Use this in protected Server Components
 */
export async function requireAuth() {
  const session = await getSession();
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  
  return session;
}

/**
 * Require specific role - throws if user doesn't have required role
 * @param requiredRole - Minimum role level required
 */
export async function requireRole(requiredRole: UserRole) {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;
  
  const roleHierarchy = {
    [UserRole.USER]: 0,
    [UserRole.STAFF]: 1,
    [UserRole.ADMIN]: 2,
  };
  
  if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  
  return session;
}

/**
 * Check if user has at least the specified role
 * Returns boolean, doesn't throw
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  try {
    await requireRole(requiredRole);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get user role from session
 * Returns null if not authenticated
 */
export async function getUserRole(): Promise<UserRole | null> {
  const session = await getSession();
  return ((session?.user as { role?: string })?.role as UserRole) || null;
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === UserRole.ADMIN;
}

/**
 * Check if user is staff or admin
 */
export async function isStaff(): Promise<boolean> {
  const role = await getUserRole();
  return role === UserRole.STAFF || role === UserRole.ADMIN;
}
