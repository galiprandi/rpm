import { UserRole } from '@/lib/auth/roles';

/**
 * Check if a given role is allowed to access an item that requires any of the listed roles.
 * ADMIN always has access to everything.
 */
export function canAccess(userRole: UserRole | string | undefined, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false;
  const role = userRole as UserRole;
  if (role === UserRole.ADMIN) return true;
  return requiredRoles.includes(role);
}
