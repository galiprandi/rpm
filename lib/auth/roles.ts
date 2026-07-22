/**
 * Role management system for RPM Accesorios
 * 
 * SERVER-ONLY: This file uses Drizzle and can only be used in server components or API routes.
 * For client-side role logic, use roles-client.ts instead.
 */

import { db } from '../db';
import { userRole, user } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export enum UserRole {
  USER = 'USER',        // Clientes finales - Acceso a /
  STAFF = 'STAFF',      // Staff básico - Acceso a /adm limitado
  ADMIN = 'ADMIN'       // Administradores - Acceso completo a /adm
}

// Domains that automatically get STAFF role if no explicit role in DB
const STAFF_DOMAINS = ['rpmacc.com', 'rpm-sys.com'];

/**
 * Assigns user role based on database lookup or email domain fallback
 * 
 * Priority:
 * 1. Check UserRole table for explicit role assignment
 * 2. Fall back to domain-based assignment (STAFF for company domains)
 * 3. Default to USER
 * 
 * @param email - User email address
 * @returns UserRole assigned to the user
 */
export const getUserRole = async (email: string): Promise<UserRole> => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check database for explicit role
  const user_roleRecord = await db.query.userRole.findFirst({
    where: eq(userRole.email, normalizedEmail),
  });

  console.log('[getUserRole] Email:', normalizedEmail, 'DB Record:', user_roleRecord);

  if (user_roleRecord?.isActive) {
    // Map database role to enum (handles both old and new role names)
    const role = user_roleRecord.role.toUpperCase();
    if (role === 'ADMIN' || role === 'SELLER' || role === 'TECHNICIAN' || role === 'CASHIER') {
      return UserRole.ADMIN;
    }
    if (role === 'STAFF') {
      return UserRole.STAFF;
    }
    return UserRole.USER;
  }

  // Domain-based fallback for company emails
  if (STAFF_DOMAINS.some(domain => email.endsWith(`@${domain}`))) {
    console.log('[getUserRole] Using STAFF domain fallback for:', email);
    return UserRole.STAFF;
  }

  // Default: regular user
  console.log('[getUserRole] Default USER role for:', email);
  return UserRole.USER;
};

/**
 * Gets all admin emails from database
 * 
 * @returns Array of admin email addresses
 */
export const getAdminEmails = async (): Promise<string[]> => {
  const admins = await db.query.userRole.findMany({
    where: and(
      inArray(userRole.role, ['ADMIN', 'SELLER', 'TECHNICIAN', 'CASHIER']),
      eq(userRole.isActive, true),
    ),
  });
  return admins.map((a) => a.email);
};

/**
 * Gets all staff domains for configuration purposes
 * 
 * @returns Array of staff domain strings
 */
export const getStaffDomains = (): string[] => {
  return [...STAFF_DOMAINS];
};

/**
 * Create or update a user role in the database
 * 
 * @param email - User email
 * @param role - Role to assign
 * @param name - Optional name for identification
 * @param notes - Optional notes
 */
export const setUserRole = async (
  email: string,
  role: UserRole,
  name?: string,
  notes?: string
): Promise<void> => {
  const existing = await db.query.userRole.findFirst({
    where: eq(userRole.email, email),
  });

  if (existing) {
    await db
      .update(userRole)
      .set({
        role,
        name: name ?? null,
        notes: notes ?? null,
        isActive: true,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userRole.email, email));
  } else {
    await db.insert(userRole).values({
      id: crypto.randomUUID(),
      email,
      role,
      name: name ?? null,
      notes: notes ?? null,
      isActive: true,
      updatedAt: new Date().toISOString(),
    });
  }
};

/**
 * Checks if a user has a specific role
 * 
 * @param userId - User ID to check
 * @param role - Role to check for
 * @returns boolean indicating if user has the role
 */
export const hasRole = async (userId: string, role: UserRole): Promise<boolean> => {
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!userRecord?.email) {
    console.log('[hasRole] User not found or no email:', userId);
    return false;
  }

  const user_role = await getUserRole(userRecord.email);
  console.log('[hasRole] Email:', userRecord.email, 'Role:', user_role, 'Expected:', role);
  return user_role === role;
};

