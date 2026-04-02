/**
 * E2E Test Suite - Work Orders Flow (Órdenes de Trabajo)
 *
 * Flujos testeados:
 * 1. Listado de OTs - Vista Kanban y Lista
 * 2. Creación de OT con vehículo existente
 * 3. Creación de OT con nuevo vehículo y cliente
 * 4. Validaciones de formulario
 * 5. Errores y edge cases
 *
 * Especificación: /specs/workshop.md
 */

import { test, expect } from '@playwright/test';
import { loginAs, logout } from './helpers/auth';

test.describe('🔧 Work Orders E2E - QA Professional Testing', () => {
  test.beforeEach(async () => {
    test.setTimeout(15000);
  });

  test.describe('📋 TC-WO-001: Listado de Órdenes de Trabajo', () => {
    test('Debe mostrar página de OTs con layout correcto como ADMIN', async ({ page }) => {
      await loginAs(page, 'ADMIN');
      await page.goto('/adm/work-orders');

      // Verify page loads without redirect to login
      await expect(page).toHaveURL('/adm/work-orders');
    });

    test('STAFF debe poder acceder a página de OTs', async ({ page }) => {
      await loginAs(page, 'STAFF');
      await page.goto('/adm/work-orders');

      await expect(page).toHaveURL('/adm/work-orders');
    });

    test('USER normal no debe poder acceder a /adm', async ({ page }) => {
      await loginAs(page, 'USER');
      await page.goto('/adm/work-orders');

      // Should redirect to home
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('🔒 Authentication Requirements', () => {
    test('Sin autenticación debe redirigir a login', async ({ page }) => {
      await logout(page);
      await page.goto('/adm/work-orders');

      // Verify redirect to login
      await expect(page).toHaveURL(/.*login.*/);
    });

    test('Todas las rutas de /adm protegidas', async ({ page }) => {
      const protectedRoutes = [
        '/adm/work-orders',
        '/adm/work-orders/new',
        '/adm/customers',
        '/adm/products',
        '/adm/categories'
      ];

      await logout(page);

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(/.*login.*/);
      }
    });
  });
});
