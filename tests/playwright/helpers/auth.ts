/**
 * 🎭 Playwright Auth Helpers
 * 
 * Helper functions for debug authentication in tests.
 * Uses the debug auth API to bypass Google OAuth during development.
 * 
 * ## 🚀 Guía Rápida
 * 
 * ```typescript
 * import { loginAs, logout, setupAuth } from './auth';
 * 
 * // Login simple
 * await loginAs(page, 'ADMIN');
 * await page.goto('/adm/products');
 * 
 * // Login en beforeEach
 * test.beforeEach(async ({ page }) => {
 *   await setupAuth(page, 'ADMIN');
 * });
 * 
 * // Cambiar de rol
 * await loginAs(page, 'USER');
 * await page.goto('/adm'); // Redirigido a /
 * 
 * // Logout
 * await logout(page);
 * ```
 * 
 * ## 🎯 Roles Disponibles
 * 
 * - `'ADMIN'` - Acceso completo a todo el sistema
 * - `'STAFF'` - Acceso a operaciones del admin panel
 * - `'USER'` - Acceso público solo (para testear redirecciones)
 * 
 * ## 📂 Secciones para Testear
 * 
 * ```typescript
 * // Panel de administración
 * await page.goto('/adm');
 * 
 * // Gestión de productos
 * await page.goto('/adm/products');
 * 
 * // Gestión de categorías
 * await page.goto('/adm/categories');
 * 
 * // Gestión de clientes
 * await page.goto('/adm/customers');
 * 
 * // Órdenes de trabajo
 * await page.goto('/adm/work-orders');
 * ```
 * 
 * @see /tests/playwright/README.md - Guía completa
 * @example
 * ```typescript
 * import { test, expect } from '@playwright/test';
 * import { loginAs, logout } from './auth';
 * 
 * test('admin test', async ({ page }) => {
 *   await loginAs(page, 'ADMIN');
 *   await page.goto('/adm/products');
 *   // ... test code
 * });
 * ```
 */

import { Page, APIRequestContext } from '@playwright/test';

export type DebugRole = 'USER' | 'STAFF' | 'ADMIN';

/**
 * Login with a specific debug role
 * Creates a debug session via API and sets cookies automatically
 */
export async function loginAs(page: Page, role: DebugRole): Promise<void> {
  // Call debug auth API to create session
  const response = await page.request.post('/api/auth/debug', {
    data: { role },
  });

  if (!response.ok()) {
    const error = await response.text();
    throw new Error(`Failed to create debug session: ${error}`);
  }

  // Reload page to pick up the new session cookie
  await page.reload();
}

/**
 * Login with a specific role using API request context
 * Useful for API tests or when you don't have a page object
 */
export async function loginAsApi(
  request: APIRequestContext,
  role: DebugRole,
  baseURL?: string
): Promise<{ cookies: string }> {
  const url = baseURL ? `${baseURL}/api/auth/debug` : '/api/auth/debug';
  
  const response = await request.post(url, {
    data: { role },
  });

  if (!response.ok()) {
    const error = await response.text();
    throw new Error(`Failed to create debug session: ${error}`);
  }

  // Extract cookies from response
  const cookies = response.headers()['set-cookie'] || '';
  
  return { cookies };
}

/**
 * Logout - clear debug session
 */
export async function logout(page: Page): Promise<void> {
  const response = await page.request.delete('/api/auth/debug');
  
  if (!response.ok()) {
    console.warn('Failed to clear debug session');
  }

  // Reload to clear session
  await page.reload();
}

/**
 * Check current debug session status
 * Returns null if no session exists
 */
export async function getDebugSession(page: Page): Promise<{
  enabled: boolean;
  authenticated: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  role?: string;
} | null> {
  const response = await page.request.get('/api/auth/debug');
  
  if (!response.ok()) {
    return null;
  }

  return await response.json();
}

/**
 * Setup function for test hooks
 * Automatically logs in with the specified role before tests
 * 
 * @example
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   await setupAuth(page, 'ADMIN');
 * });
 * ```
 */
export async function setupAuth(page: Page, role: DebugRole = 'ADMIN'): Promise<void> {
  await loginAs(page, role);
}
