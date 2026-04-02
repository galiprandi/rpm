/**
 * Better Auth Configuration for RPM Accesorios
 * 
 * Following official Better Auth documentation
 * 
 * ## 🔧 Debug Auth para Desarrollo
 * 
 * Para facilitar testing durante desarrollo, existe un modo debug que permite
 * bypass de autenticación Google OAuth. Solo disponible en desarrollo local.
 * 
 * ### Activar Debug Auth
 * 
 * 1. Setear en `.env.local`:
 *    ```
 *    DEBUG_AUTH_ENABLED=true
 *    DEBUG_AUTH_DEFAULT_ROLE=ADMIN  # USER | STAFF | ADMIN
 *    ```
 * 
 * 2. Iniciar servidor con modo debug:
 *    ```bash
 *    pnpm dev:debug
 *    # o
 *    DEBUG_AUTH_ENABLED=true pnpm dev
 *    ```
 * 
 * ### Uso con Playwright - Probar Secciones del Sistema
 * 
 * #### Ejemplo 1: Testear Panel de Administración
 * ```typescript
 * import { loginAs } from '@/tests/playwright/helpers/auth';
 * 
 * test('admin puede ver productos', async ({ page }) => {
 *   await loginAs(page, 'ADMIN');
 *   await page.goto('/adm/products');
 *   await expect(page.locator('h1')).toContainText('Productos');
 * });
 * ```
 * 
 * #### Ejemplo 2: Testear con diferentes roles
 * ```typescript
 * test('permisos de roles', async ({ page }) => {
 *   // ADMIN tiene acceso completo
 *   await loginAs(page, 'ADMIN');
 *   await page.goto('/adm/categories');
 *   await expect(page).toHaveURL('/adm/categories');
 *   
 *   // STAFF tiene acceso limitado
 *   await loginAs(page, 'STAFF');
 *   await page.goto('/adm/work-orders');
 *   await expect(page).toHaveURL('/adm/work-orders');
 *   
 *   // USER no tiene acceso a /adm
 *   await loginAs(page, 'USER');
 *   await page.goto('/adm/products');
 *   await expect(page).toHaveURL('/');  // Redirigido a home
 * });
 * ```
 * 
 * #### Ejemplo 3: Setup automático para suite
 * ```typescript
 * import { setupAuth } from '@/tests/playwright/helpers/auth';
 * 
 * test.describe('Suite de productos', () => {
 *   test.beforeEach(async ({ page }) => {
 *     await setupAuth(page, 'ADMIN');
 *   });
 *   
 *   test('crear producto', async ({ page }) => {
 *     await page.goto('/adm/products');
 *     await page.click('text=Nuevo');
 *     // ... resto del test
 *   });
 *   
 *   test('editar producto', async ({ page }) => {
 *     await page.goto('/adm/products');
 *     await page.click('text=Editar');
 *     // ... resto del test
 *   });
 * });
 * ```
 * 
 * ### Roles Disponibles para Testing
 * 
 * | Rol | Acceso | Uso recomendado |
 * |-----|--------|-----------------|
 * | `ADMIN` | Todo el sistema | CRUD completo, settings |
 * | `STAFF` | /adm operativo | Operaciones diarias |
 * | `USER` | Solo público | Testear redirecciones |
 * 
 * ### Secciones Protegidas para Testear
 * 
 * - `/adm` - Panel principal
 * - `/adm/products` - Gestión de productos
 * - `/adm/categories` - Gestión de categorías
 * - `/adm/customers` - Gestión de clientes
 * - `/adm/work-orders` - Órdenes de trabajo
 * 
 * ### API de Debug (uso avanzado)
 * - `POST /api/auth/debug` - Crear sesión con rol específico
 * - `DELETE /api/auth/debug` - Limpiar sesión
 * - `GET /api/auth/debug` - Verificar estado de sesión
 * 
 * ### Seguridad
 * - Solo funciona cuando `NODE_ENV !== 'production'`
 * - Requiere `DEBUG_AUTH_ENABLED=true` explícito
 * - No afecta el comportamiento en producción
 * 
 * @see /tests/playwright/README.md - Guía completa
 * @see /lib/auth-server.ts - getDebugSession()
 * @see /tests/playwright/helpers/auth.ts - loginAs()
 */

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './lib/prisma';

// Google OAuth profile type
interface GoogleProfile {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  email_verified?: boolean;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  account: {
    accountLinking: {
      enabled: false,
    },
    // Update user profile from OAuth on every sign-in
    overrideUserInfo: true,
  },
  emailAndPassword: {
    enabled: false,
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Map profile fields from Google OAuth response
      mapProfile: (profile: GoogleProfile) => {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified,
        };
      },
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
});

export type Session = typeof auth.$Infer.Session;
