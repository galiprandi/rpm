import { UserRole } from '@/lib/auth/roles-client';

/**
 * Check if a given role is allowed to access an item that requires any of the listed roles.
 * ADMIN always has access to everything.
 * VENDEDOR has access to anything STAFF can access (hierarchy).
 */
export function canAccess(userRole: UserRole | string | undefined, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false;
  const role = userRole as UserRole;
  if (role === UserRole.ADMIN) return true;
  // VENDEDOR is above STAFF in hierarchy — can access anything STAFF can
  if (role === UserRole.VENDEDOR && requiredRoles.includes(UserRole.STAFF)) return true;
  return requiredRoles.includes(role);
}
