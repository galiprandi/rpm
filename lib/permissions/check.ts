/**
 * Permission checking utilities — server-side.
 *
 * ADMIN always has all permissions (hardcoded, no DB lookup).
 * STAFF and VENDEDOR have permissions from the role_permission table.
 */

import { db } from "@/lib/db";
import { rolePermission } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { UserRole } from "@/lib/auth/roles";
import { isValidPermission, DEFAULT_PERMISSIONS, type ConfigurableRole } from "./catalog";

/** Session user type with permissions */
export interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  permissions?: string[];
}

/**
 * Check if a session user has a specific permission.
 * ADMIN always returns true.
 * Other roles check the permissions array (loaded at login).
 */
export function hasPermission(session: { user: SessionUser } | null | undefined, permission: string): boolean {
  if (!session?.user) return false;
  const role = (session.user.role?.toUpperCase() as UserRole) || UserRole.USER;
  if (role === UserRole.ADMIN) return true;
  const permissions = session.user.permissions;
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Load permissions for a role from the database.
 * Returns the list of enabled permission IDs.
 * ADMIN returns ['*'] (wildcard).
 * Unknown roles return [].
 */
export async function loadPermissionsForRole(role: string): Promise<string[]> {
  const normalizedRole = role.toUpperCase();

  // ADMIN always has all permissions
  if (normalizedRole === UserRole.ADMIN) {
    return ["*"];
  }

  // Only STAFF and VENDEDOR are configurable
  if (normalizedRole !== UserRole.STAFF && normalizedRole !== UserRole.VENDEDOR) {
    return [];
  }

  const rows = await db.query.rolePermission.findMany({
    where: and(
      eq(rolePermission.role, normalizedRole),
      eq(rolePermission.enabled, true),
    ),
  });

  // If no rows in DB yet, return defaults
  if (rows.length === 0) {
    return DEFAULT_PERMISSIONS[normalizedRole as ConfigurableRole] ?? [];
  }

  return rows.map((r) => r.permission);
}

/**
 * Get all permissions for all configurable roles (for Settings UI).
 * Returns a map: { STAFF: string[], VENDEDOR: string[] }
 */
export async function loadAllPermissions(): Promise<Record<string, string[]>> {
  const result: Record<string, string[]> = {
    STAFF: [],
    VENDEDOR: [],
  };

  for (const role of ["STAFF", "VENDEDOR"] as ConfigurableRole[]) {
    result[role] = await loadPermissionsForRole(role);
  }

  return result;
}

/**
 * Save permissions for a role (batch).
 * Deletes all existing rows for the role and inserts new ones.
 * Only configurable roles are allowed (STAFF, VENDEDOR).
 */
export async function savePermissionsForRole(
  role: string,
  permissions: string[],
): Promise<void> {
  const normalizedRole = role.toUpperCase() as ConfigurableRole;

  // Validate role is configurable
  if (normalizedRole !== "STAFF" && normalizedRole !== "VENDEDOR") {
    throw new Error(`Role ${role} is not configurable`);
  }

  // Validate all permissions exist in catalog
  for (const perm of permissions) {
    if (!isValidPermission(perm)) {
      throw new Error(`Invalid permission: ${perm}`);
    }
  }

  // Delete existing rows for this role
  await db.delete(rolePermission).where(eq(rolePermission.role, normalizedRole));

  // Insert new rows (only enabled permissions)
  if (permissions.length > 0) {
    await db.insert(rolePermission).values(
      permissions.map((perm) => ({
        id: crypto.randomUUID(),
        role: normalizedRole,
        permission: perm,
        enabled: true,
        updatedAt: new Date().toISOString(),
      })),
    );
  }
}

/**
 * Seed default permissions if the role_permission table is empty.
 * Called on startup or migration.
 */
export async function seedDefaultPermissions(): Promise<void> {
  const existing = await db.query.rolePermission.findMany();
  if (existing.length > 0) return;

  for (const role of ["STAFF", "VENDEDOR"] as ConfigurableRole[]) {
    const perms = DEFAULT_PERMISSIONS[role];
    if (perms.length === 0) continue;

    await db.insert(rolePermission).values(
      perms.map((perm) => ({
        id: crypto.randomUUID(),
        role,
        permission: perm,
        enabled: true,
        updatedAt: new Date().toISOString(),
      })),
    );
  }
}
