/**
 * Role management system for RPM Accesorios
 * 
 * Defines user roles and provides role assignment logic
 * based on email domains and specific admin whitelist
 */

export enum UserRole {
  USER = 'USER',        // Clientes finales - Acceso a /
  STAFF = 'STAFF',      // Staff básico - Acceso a /adm limitado
  ADMIN = 'ADMIN'       // Administradores - Acceso completo a /adm
}

/**
 * Assigns user role based on email address
 * 
 * Strategy:
 * - Admin emails: Specific whitelist for full access
 * - Staff domains: Company domains for staff access
 * - All others: Regular users
 * 
 * @param email - User email address
 * @returns UserRole assigned to the user
 */
export const getUserRole = (email: string): UserRole => {
  const adminEmails = [
    'admin@rpmacc.com', 
    'galiprandi@rpmacc.com',
    'it@rpmacc.com'
  ];
  const staffDomains = ['rpmacc.com', 'rpm-sys.com'];
  
  if (adminEmails.includes(email)) {
    return UserRole.ADMIN;
  }
  
  if (staffDomains.some(domain => email.endsWith(domain))) {
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
 * Gets all admin emails for configuration purposes
 * 
 * @returns Array of admin email addresses
 */
export const getAdminEmails = (): string[] => {
  return [
    'admin@rpmacc.com', 
    'galiprandi@rpmacc.com',
    'it@rpmacc.com'
  ];
};

/**
 * Gets all staff domains for configuration purposes
 * 
 * @returns Array of staff domain strings
 */
export const getStaffDomains = (): string[] => {
  return ['rpmacc.com', 'rpm-sys.com'];
};
