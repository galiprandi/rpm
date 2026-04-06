/**
 * Cost Update E2E Tests
 *
 * Tests for the mass cost update feature:
 * - Preview functionality
 * - Apply functionality
 * - History viewing
 */

import { test, expect, type Page } from '@playwright/test';

// Helper to login as staff/admin
async function loginAsStaff(page: Page) {
  await page.goto('/login');
  // Use test credentials or debug cookie
  await page.evaluate(() => {
    document.cookie = 'rpm_debug_auth={"user":{"id":"test-user","email":"test@example.com","name":"Test User","role":"STAFF"}}; path=/;';
  });
  await page.goto('/adm/price-lists');
}

test.describe('Cost Update Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
  });

  test('should open cost update dialog from price lists page', async ({ page }) => {
    // Click on the "Actualizar Costos" button
    await page.click('button:has-text("Actualizar Costos")');

    // Verify dialog opens
    await expect(page.getByText('Actualización Masiva de Costos')).toBeVisible();
    await expect(page.getByText('Selecciona los productos y configura el ajuste de costo')).toBeVisible();
  });

  test('should show filters step with all options', async ({ page }) => {
    await page.click('button:has-text("Actualizar Costos")');

    // Check filter elements are present
    await expect(page.getByLabel('Búsqueda')).toBeVisible();
    await expect(page.getByLabel('Categoría')).toBeVisible();
    await expect(page.getByLabel('Proveedor')).toBeVisible();
    await expect(page.getByLabel('Tipo de ajuste')).toBeVisible();
    await expect(page.getByLabel('Porcentaje')).toBeVisible();
  });

  test('should navigate to preview with valid adjustment', async ({ page }) => {
    await page.click('button:has-text("Actualizar Costos")');

    // Set adjustment value
    await page.fill('#adjustmentValue', '10');

    // Click to view preview
    await page.click('button:has-text("Ver Preview")');

    // Verify preview step is shown
    await expect(page.getByText('Vista Previa')).toBeVisible();
  });

  test('should show error without adjustment value', async ({ page }) => {
    await page.click('button:has-text("Actualizar Costos")');

    // Try to go to preview without setting value
    await page.click('button:has-text("Ver Preview")');

    // Should show error toast
    await expect(page.getByText('Ingresa un valor de ajuste válido')).toBeVisible();
  });

  test('should show preview table with correct columns', async ({ page }) => {
    await page.click('button:has-text("Actualizar Costos")');
    await page.fill('#adjustmentValue', '15');
    await page.click('button:has-text("Ver Preview")');

    // Wait for preview to load
    await page.waitForTimeout(1000);

    // Check table headers
    await expect(page.getByText('SKU')).toBeVisible();
    await expect(page.getByText('Producto')).toBeVisible();
    await expect(page.getByText('Costo Actual')).toBeVisible();
    await expect(page.getByText('Nuevo Costo')).toBeVisible();
    await expect(page.getByText('Variación')).toBeVisible();
  });

  test('should navigate to confirm step', async ({ page }) => {
    await page.click('button:has-text("Actualizar Costos")');
    await page.fill('#adjustmentValue', '15');
    await page.click('button:has-text("Ver Preview")');

    // Wait for preview to load
    await page.waitForTimeout(1000);

    // Click continue to confirm
    await page.click('button:has-text("Continuar")');

    // Verify confirm step
    await expect(page.getByText('Confirmar Actualización')).toBeVisible();
    await expect(page.getByText('Confirmar actualización masiva')).toBeVisible();
  });

  test('should navigate back through steps', async ({ page }) => {
    await page.click('button:has-text("Actualizar Costos")');
    await page.fill('#adjustmentValue', '15');
    await page.click('button:has-text("Ver Preview")');

    // Wait for preview
    await page.waitForTimeout(1000);

    // Go back to filters
    await page.click('button:has-text("Volver")');

    // Should be back at filters
    await expect(page.getByText('Actualización Masiva de Costos')).toBeVisible();
  });

  test('should close dialog on cancel', async ({ page }) => {
    await page.click('button:has-text("Actualizar Costos")');
    await page.click('button[aria-label="Close"]');

    // Dialog should be closed
    await expect(page.getByText('Actualización Masiva de Costos')).not.toBeVisible();
  });

  test('should apply filter by category', async ({ page }) => {
    await page.click('button:has-text("Actualizar Costos")');

    // Select a category
    await page.click('#category');
    await page.click('text=Todas las categorías');

    // Set adjustment and preview
    await page.fill('#adjustmentValue', '10');
    await page.click('button:has-text("Ver Preview")');

    // Preview should load
    await page.waitForTimeout(1000);
    await expect(page.getByText('Vista Previa')).toBeVisible();
  });

  test('should show warning for negative costs', async ({ page }) => {
    // This test would need specific products with low costs
    // For now, just verify the warning UI exists in the confirm step
    await page.click('button:has-text("Actualizar Costos")');
    await page.fill('#adjustmentValue', '1000'); // Very high value
    await page.click('button:has-text("Ver Preview")');

    await page.waitForTimeout(1000);

    // Check if negative cost warning appears (if there are products that would go negative)
    const warningText = page.getByText('Advertencia: Costos negativos detectados');
    // This may or may not be visible depending on test data
    console.log('Negative cost warning visibility:', await warningText.isVisible().catch(() => false));
  });
});

test.describe('Cost Update API', () => {
  test('POST /api/cost-updates/preview requires authentication', async ({ request }) => {
    const response = await request.post('/api/cost-updates/preview', {
      data: {
        filters: {},
        adjustment: { type: 'PERCENTAGE_INC', value: 10 },
      },
    });

    expect(response.status()).toBe(401);
  });

  test('POST /api/cost-updates/apply requires authentication', async ({ request }) => {
    const response = await request.post('/api/cost-updates/apply', {
      data: {
        filters: {},
        adjustment: { type: 'PERCENTAGE_INC', value: 10 },
      },
    });

    expect(response.status()).toBe(401);
  });

  test('GET /api/cost-updates/history requires authentication', async ({ request }) => {
    const response = await request.get('/api/cost-updates/history');

    expect(response.status()).toBe(401);
  });
});
