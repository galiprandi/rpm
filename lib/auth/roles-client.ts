/**
 * Client-side role management system for RPM Accesorios
 * 
 * This file contains only synchronous, client-safe functions that don't use Drizzle.
 * For server-side role logic with database access, use roles.ts instead.
 */

export enum UserRole {
  USER = 'USER',        // Clientes finales - Acceso a /
  STAFF = 'STAFF',      // Staff básico - Acceso a /adm limitado
  ADMIN = 'ADMIN'       // Administradores - Acceso completo a /adm
}

// Domains that automatically get STAFF role if no explicit role in DB
const STAFF_DOMAINS = ['rpmacc.com', 'rpm-sys.com'];

/**
 * Synchronous version for use in client components
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
 * Gets all staff domains for configuration purposes
 * 
 * @returns Array of staff domain strings
 */
export const getStaffDomains = (): string[] => {
  return [...STAFF_DOMAINS];
};
