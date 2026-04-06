import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

/**
 * E2E Tests - Sistema de Pagos
 * 
 * Este test verifica:
 * 1. CRUD de Métodos de Pago (solo ADMIN)
 * 2. Registro de pagos en Work Orders
 * 3. Visualización de badges de pago en Kanban
 */

test.describe('Sistema de Pagos', () => {
  test.use({
    baseURL: 'http://localhost:3000',
  });

  test.describe('Métodos de Pago (ADMIN)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'ADMIN');
    });

    test('debe crear un nuevo método de pago', async ({ page }) => {
      // Navegar a la página de métodos de pago
      await page.goto('/adm/payment-methods');
      await expect(page.locator('text=Métodos de Pago')).toBeVisible();

      // Crear nuevo método de pago
      await page.click('text=Nuevo Método');
      await page.fill('[name="name"]', 'Test Pago');
      await page.fill('[name="code"]', 'TEST_PAY');
      await page.fill('[name="description"]', 'Método de pago para testing');
      await page.fill('[name="sortOrder"]', '99');

      // Guardar
      await page.click('button[type="submit"]');

      // Verificar que aparece en la lista
      await expect(page.locator('text=Test Pago')).toBeVisible();
      await expect(page.locator('text=TEST_PAY')).toBeVisible();
    });

    test('debe editar un método de pago existente', async ({ page }) => {
      await page.goto('/adm/payment-methods');

      // Buscar y editar el método creado
      const row = page.locator('tr:has-text("Test Pago")');
      await row.locator('button[aria-label="Editar"]').click();

      // Cambiar nombre
      await page.fill('[name="name"]', 'Test Pago Actualizado');
      await page.click('button[type="submit"]');

      // Verificar actualización
      await expect(page.locator('text=Test Pago Actualizado')).toBeVisible();
    });

    test('debe desactivar un método de pago', async ({ page }) => {
      await page.goto('/adm/payment-methods');

      // Editar y desactivar
      const row = page.locator('tr:has-text("Test Pago")');
      await row.locator('button[aria-label="Editar"]').click();

      // Desmarcar activo
      await page.click('[name="isActive"]');
      await page.click('button[type="submit"]');

      // Verificar estado inactivo
      await expect(page.locator('text=Inactivo')).toBeVisible();
    });

    test('debe eliminar un método de pago sin pagos', async ({ page }) => {
      await page.goto('/adm/payment-methods');

      // Buscar el método desactivado y eliminarlo
      const row = page.locator('tr:has-text("Test Pago")');
      await row.locator('button[aria-label="Eliminar"]').click();

      // Confirmar eliminación
      await page.click('text=Eliminar');

      // Verificar que ya no aparece
      await expect(page.locator('text=Test Pago Actualizado')).not.toBeVisible();
    });
  });

  test.describe('Registro de Pagos en Work Orders', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'ADMIN');
    });

    test('debe registrar un pago completo en una OT', async ({ page }) => {
      // Primero crear una OT de prueba
      await page.goto('/adm/work-orders/new');

      // Seleccionar cliente
      await page.click('[data-testid="customer-select"]');
      await page.fill('[data-testid="customer-search"]', 'Test');
      await page.click('text=Test Customer');

      // Seleccionar vehículo
      await page.click('[data-testid="vehicle-select"]');
      await page.click('text=ABC123');

      // Agregar servicio
      await page.click('text=Agregar Servicio');
      await page.fill('[name="serviceSearch"]', 'Instalación');
      await page.click('text=Instalación de Alarmas');
      await page.fill('[name="price"]', '15000');
      await page.click('text=Agregar');

      // Crear OT
      await page.click('text=Crear Orden de Trabajo');

      // Esperar redirección a detalle
      await page.waitForURL(/\/adm\/work-orders\/\w+/);

      // Registrar pago
      await page.click('text=Registrar Pago');

      // Seleccionar método de pago
      await page.click('[data-testid="payment-method-select"]');
      await page.click('text=Efectivo');

      // Ingresar monto (total)
      const totalText = await page.locator('[data-testid="work-order-total"]').textContent();
      const total = totalText?.replace(/[^0-9]/g, '') || '15000';
      await page.fill('[name="amount"]', total);
      await page.fill('[name="notes"]', 'Pago completo en efectivo');

      // Confirmar pago
      await page.click('text=Confirmar Pago');

      // Verificar que el pago aparece en el historial
      await expect(page.locator('text=Pago completo en efectivo')).toBeVisible();
      await expect(page.locator('text=Pagado')).toBeVisible();
    });

    test('debe registrar pagos parciales', async ({ page }) => {
      // Crear OT de prueba
      await page.goto('/adm/work-orders/new');

      // ... (simplified version)
      // Seleccionar cliente y vehículo
      await page.click('[data-testid="customer-select"]');
      await page.fill('[data-testid="customer-search"]', 'Test');
      await page.click('text=Test Customer');
      await page.click('[data-testid="vehicle-select"]');
      await page.click('text=ABC123');

      // Agregar servicio de $20000
      await page.click('text=Agregar Servicio');
      await page.fill('[name="serviceSearch"]', 'Instalación');
      await page.click('text=Instalación de Alarmas');
      await page.fill('[name="price"]', '20000');
      await page.click('text=Agregar');

      // Crear OT
      await page.click('text=Crear Orden de Trabajo');
      await page.waitForURL(/\/adm\/work-orders\/\w+/);

      // Registrar primer pago parcial ($10000)
      await page.click('text=Registrar Pago');
      await page.click('[data-testid="payment-method-select"]');
      await page.click('text=Efectivo');
      await page.fill('[name="amount"]', '10000');
      await page.click('text=Confirmar Pago');

      // Verificar estado parcial
      await expect(page.locator('text=Pendiente')).toBeVisible();
      await expect(page.locator('text=$10.000')).toBeVisible();

      // Registrar segundo pago ($10000 restante)
      await page.click('text=Registrar Pago');
      await page.click('[data-testid="payment-method-select"]');
      await page.click('text=Transferencia');
      await page.fill('[name="amount"]', '10000');
      await page.fill('[name="notes"]', 'Transferencia bancaria');
      await page.click('text=Confirmar Pago');

      // Verificar estado pagado completo
      await expect(page.locator('text=Pagado')).toBeVisible();
    });

    test('no debe permitir pagos sin método de pago seleccionado', async ({ page }) => {
      // Navegar a una OT existente
      await page.goto('/adm/work-orders');
      const firstDetailButton = page.locator('text=Ver detalle').first();
      await firstDetailButton.click();

      // Intentar registrar pago
      await page.click('text=Registrar Pago');
      await page.fill('[name="amount"]', '1000');

      // El botón de confirmar debe estar deshabilitado
      const confirmButton = page.locator('text=Confirmar Pago');
      await expect(confirmButton).toBeDisabled();
    });
  });

  test.describe('Badges de Pago en Kanban', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'ADMIN');
    });

    test('debe mostrar badge verde para OTs pagadas', async ({ page }) => {
      // Crear OT y pagarla completamente
      await page.goto('/adm/work-orders/new');

      // Seleccionar cliente y vehículo
      await page.click('[data-testid="customer-select"]');
      await page.fill('[data-testid="customer-search"]', 'Test');
      await page.click('text=Test Customer');
      await page.click('[data-testid="vehicle-select"]');
      await page.click('text=ABC123');

      // Agregar servicio
      await page.click('text=Agregar Servicio');
      await page.fill('[name="serviceSearch"]', 'Instalación');
      await page.click('text=Instalación de Alarmas');
      await page.fill('[name="price"]', '15000');
      await page.click('text=Agregar');

      // Crear OT
      await page.click('text=Crear Orden de Trabajo');
      await page.waitForURL(/\/adm\/work-orders\/\w+/);

      // Pagar completo
      await page.click('text=Registrar Pago');
      await page.click('[data-testid="payment-method-select"]');
      await page.click('text=Efectivo');
      await page.fill('[name="amount"]', '15000');
      await page.click('text=Confirmar Pago');

      // Volver al Kanban
      await page.goto('/adm/work-orders');

      // Verificar badge verde
      const card = page.locator('[data-testid="work-order-card"]').filter({ hasText: 'ABC123' });
      await expect(card.locator('text=Pagado')).toBeVisible();
      await expect(card.locator('.bg-green-100')).toBeVisible();
    });

    test('debe mostrar badge amarillo para pagos parciales', async ({ page }) => {
      // Crear OT con pago parcial
      await page.goto('/adm/work-orders/new');

      // ... setup similar al anterior
      await page.click('[data-testid="customer-select"]');
      await page.fill('[data-testid="customer-search"]', 'Test');
      await page.click('text=Test Customer');
      await page.click('[data-testid="vehicle-select"]');
      await page.click('text=ABC123');

      await page.click('text=Agregar Servicio');
      await page.fill('[name="serviceSearch"]', 'Instalación');
      await page.click('text=Instalación de Alarmas');
      await page.fill('[name="price"]', '20000');
      await page.click('text=Agregar');

      await page.click('text=Crear Orden de Trabajo');
      await page.waitForURL(/\/adm\/work-orders\/\w+/);

      // Pagar parcialmente
      await page.click('text=Registrar Pago');
      await page.click('[data-testid="payment-method-select"]');
      await page.click('text=Efectivo');
      await page.fill('[name="amount"]', '10000');
      await page.click('text=Confirmar Pago');

      // Volver al Kanban
      await page.goto('/adm/work-orders');

      // Verificar badge amarillo
      const card = page.locator('[data-testid="work-order-card"]').filter({ hasText: 'ABC123' });
      await expect(card.locator('text=Parcial')).toBeVisible();
      await expect(card.locator('.bg-yellow-100')).toBeVisible();
    });

    test('debe mostrar badge gris para OTs sin pagar', async ({ page }) => {
      // Crear OT sin pagar
      await page.goto('/adm/work-orders/new');

      await page.click('[data-testid="customer-select"]');
      await page.fill('[data-testid="customer-search"]', 'Test');
      await page.click('text=Test Customer');
      await page.click('[data-testid="vehicle-select"]');
      await page.click('text=ABC123');

      await page.click('text=Agregar Servicio');
      await page.fill('[name="serviceSearch"]', 'Instalación');
      await page.click('text=Instalación de Alarmas');
      await page.fill('[name="price"]', '15000');
      await page.click('text=Agregar');

      await page.click('text=Crear Orden de Trabajo');

      // Volver al Kanban
      await page.goto('/adm/work-orders');

      // Verificar badge gris
      const card = page.locator('[data-testid="work-order-card"]').filter({ hasText: 'ABC123' });
      await expect(card.locator('text=Sin pagar')).toBeVisible();
      await expect(card.locator('.bg-gray-100')).toBeVisible();
    });
  });

  test.describe('Permisos de Rol', () => {
    test('STAFF debe poder registrar pagos', async ({ page }) => {
      await loginAs(page, 'STAFF');

      // Navegar a una OT
      await page.goto('/adm/work-orders');
      const firstDetailButton = page.locator('text=Ver detalle').first();
      await firstDetailButton.click();

      // Verificar que puede ver el botón de registrar pago
      await expect(page.locator('text=Registrar Pago')).toBeVisible();
    });

    test('USER no debe poder registrar pagos', async ({ page }) => {
      await loginAs(page, 'USER');

      // Intentar acceder al detalle de OT
      await page.goto('/adm/work-orders/123');

      // Debe ser redirigido a login o home
      await expect(page).toHaveURL(/\/(login|)$/);
    });

    test('STAFF no debe poder gestionar métodos de pago', async ({ page }) => {
      await loginAs(page, 'STAFF');

      // Intentar acceder a métodos de pago
      await page.goto('/adm/payment-methods');

      // Debe ver mensaje de acceso denegado o ser redirigido
      await expect(page.locator('text=No tiene permisos')).toBeVisible();
    });
  });
});
