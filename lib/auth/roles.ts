/**
 * Role management system for RPM Accesorios
 * 
 * Fetches roles from database. Falls back to domain-based assignment for new users.
 * Note: ADMIN_EMAILS env variable is handled in auth-server.ts for server-side override
 */

import { prisma } from '../prisma';

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
  const userRoleRecord = await prisma.userRole.findUnique({
    where: { email: normalizedEmail },
  });

  if (userRoleRecord?.isActive) {
    // Map database role to enum (handles both old and new role names)
    const role = userRoleRecord.role.toUpperCase();
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
    return UserRole.STAFF;
  }

  // Default: regular user
  return UserRole.USER;
};

/**
 * Synchronous version for use in contexts where DB can't be accessed
 * Uses only domain-based logic (no DB lookup)
 * 
 * @param email - User email address
 * @returns UserRole assigned to the user
 */
export const getUserRoleSync = (email: string): UserRole => {
  if (STAFF_DOMAINS.some(domain => email.endsWith(`@${domain}`))) {
    return UserRole.STAFF;
  }
  return UserRole.USER;
};

/**
 * Validates if an email has proper format for role assignment
 * 
 * @param email - Email to validate
 * @returns boolean indicating if email is valid
 */
export const isValidEmailForRole = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Gets all admin emails from database
 * 
 * @returns Array of admin email addresses
 */
export const getAdminEmails = async (): Promise<string[]> => {
  const admins = await prisma.userRole.findMany({
    where: {
      role: { in: ['ADMIN', 'SELLER', 'TECHNICIAN', 'CASHIER'] },
      isActive: true,
    },
    select: { email: true },
  });
  return admins.map(a => a.email);
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
  await prisma.userRole.upsert({
    where: { email },
    update: {
      role,
      name: name ?? null,
      notes: notes ?? null,
      isActive: true,
    },
    create: {
      email,
      role,
      name: name ?? null,
      notes: notes ?? null,
      isActive: true,
    },
  });
};
