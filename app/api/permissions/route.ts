/**
 * API Route: /api/permissions
 * Methods: GET, PUT
 *
 * Manages role-based permissions for configurable roles (STAFF, VENDEDOR).
 * ADMIN is never configurable — always has all permissions.
 */
import { NextResponse } from "next/server";
import { withPermission } from "@/lib/api-middleware";
import {
  loadAllPermissions,
  savePermissionsForRole,
} from "@/lib/permissions/check";
import { isValidPermission, CONFIGURABLE_ROLES } from "@/lib/permissions/catalog";

/** Set of role IDs that can be configured (excludes ADMIN) */
const ALLOWED_ROLES = new Set<string>(
  CONFIGURABLE_ROLES.map((r) => r.id),
);

// GET /api/permissions — returns all permissions for configurable roles
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withPermission("can_manage_settings", async (_request) => {
  try {
    const permissions = await loadAllPermissions();
    return NextResponse.json(permissions);
  } catch (error) {
    console.error("Error loading permissions:", error);
    return NextResponse.json(
      { error: "Error al cargar permisos" },
      { status: 500 },
    );
  }
});

// PUT /api/permissions — saves permissions for all configurable roles (batch)
export const PUT = withPermission("can_manage_settings", async (request) => {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Cuerpo de la petición inválido" },
        { status: 400 },
      );
    }

    // Validate each role entry
    for (const [role, perms] of Object.entries(body)) {
      // Reject non-configurable roles (e.g. ADMIN)
      if (!ALLOWED_ROLES.has(role)) {
        return NextResponse.json(
          { error: `Rol no configurable: ${role}` },
          { status: 400 },
        );
      }

      // Permissions must be an array of strings
      if (!Array.isArray(perms)) {
        return NextResponse.json(
          { error: `Permisos inválidos para el rol ${role}` },
          { status: 400 },
        );
      }

      // Validate every permission ID exists in the catalog
      for (const perm of perms) {
        if (typeof perm !== "string" || !isValidPermission(perm)) {
          return NextResponse.json(
            { error: `Permiso inválido: ${perm}` },
            { status: 400 },
          );
        }
      }
    }

    // Save each role's permissions
    const saved: Record<string, string[]> = {};
    for (const [role, perms] of Object.entries(body)) {
      const permList = perms as string[];
      await savePermissionsForRole(role, permList);
      saved[role] = permList;
    }

    return NextResponse.json(saved);
  } catch (error) {
    console.error("Error saving permissions:", error);
    return NextResponse.json(
      { error: "Error al guardar permisos" },
      { status: 500 },
    );
  }
});
