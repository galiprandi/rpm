/**
 * 🔐 Development Authentication Bypass
 *
 * Provides zero-config auto-authentication for local development.
 * ONLY activates when RPM_DEV_BYPASS_AUTH=true and NODE_ENV=development.
 *
 * NO cookies, NO endpoints, NO tokens — bypass is pure env-var based.
 * Impossible to exploit from outside the server.
 *
 * Configuration via environment variables:
 *   RPM_DEV_BYPASS_AUTH=true       (required to enable)
 *   RPM_DEV_BYPASS_ROLE=ADMIN      (default: ADMIN)
 *   RPM_DEV_BYPASS_USER_ID=dev-user  (default: dev-user)
 *   RPM_DEV_BYPASS_NAME=Developer    (default: Developer)
 *   RPM_DEV_BYPASS_EMAIL=dev@localhost (default: dev@localhost)
 */

import { UserRole } from './auth/roles';

/**
 * Check if development auth bypass is enabled.
 * Returns false in production regardless of env vars.
 */
export function isDevBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.RPM_DEV_BYPASS_AUTH === 'true'
  );
}

/**
 * Create a mock session for development bypass.
 * Uses env vars with sensible defaults.
 */
export function createDevSession() {
  const role = (process.env.RPM_DEV_BYPASS_ROLE as UserRole) || UserRole.ADMIN;
  const userId = process.env.RPM_DEV_BYPASS_USER_ID || 'dev-user';
  const name = process.env.RPM_DEV_BYPASS_NAME || 'Developer';
  const email = process.env.RPM_DEV_BYPASS_EMAIL || 'dev@localhost';

  return {
    user: {
      id: userId,
      name,
      email,
      image: null,
      role,
    },
    session: {
      id: `dev-session-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userId,
    },
  };
}
