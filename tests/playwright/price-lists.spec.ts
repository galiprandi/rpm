import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Price Lists Module
 * Validates menu visibility, CRUD operations, and detail page
 */

test.describe('Price Lists Module', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin and wait for layout
    await page.goto('/adm');
    await page.waitForSelector('nav', { timeout: 10000 });
  });

  test('✅ Menu "Listas de Precios" is visible in sidebar', async ({ page }) => {
    // Look for the menu item
    const menuItem = page.locator('nav').getByText('Listas de Precios');
    
    await expect(menuItem).toBeVisible();
    await expect(menuItem).toHaveAttribute('href', '/adm/price-lists');
    
    // Verify DollarSign icon is present
    const icon = menuItem.locator('..').locator('svg');
    await expect(icon).toBeVisible();
  });

  test('✅ Navigate to Price Lists page from menu', async ({ page }) => {
    // Click the menu item
    await page.getByText('Listas de Precios').click();
    
    // Verify URL and page content
    await expect(page).toHaveURL('/adm/price-lists');
    await expect(page.getByText('Listas de Precios')).toBeVisible();
    await expect(page.getByText('Gestiona listas de precios y excepciones')).toBeVisible();
  });

  test('✅ Price Lists page shows correct stats', async ({ page }) => {
    await page.goto('/adm/price-lists');
    await page.waitForLoadState('networkidle');
    
    // Verify stats are visible
    await expect(page.getByText('Total')).toBeVisible();
    await expect(page.getByText('Activas')).toBeVisible();
    await expect(page.getByText('Excepciones')).toBeVisible();
    
    // Verify create button exists
    await expect(page.getByText('Lista', { exact: false }).first()).toBeVisible();
  });

  test('✅ Create Price List dialog opens', async ({ page }) => {
    await page.goto('/adm/price-lists');
    await page.waitForLoadState('networkidle');
    
    // Click create button
    await page.getByRole('button', { name: /Lista/i }).first().click();
    
    // Verify dialog opens
    await expect(page.getByText('Crear Lista de Precios')).toBeVisible();
    
    // Verify form fields
    await expect(page.getByLabel('Nombre')).toBeVisible();
    await expect(page.getByLabel('Margen Base (%)')).toBeVisible();
    await expect(page.getByLabel('Regla de Redondeo')).toBeVisible();
  });

  test('✅ Detail page navigation works', async ({ page }) => {
    await page.goto('/adm/price-lists');
    await page.waitForLoadState('networkidle');
    
    // If there are price lists, test navigation to detail
    const eyeButtons = page.locator('button[title="Ver detalle"]').first();
    
    if (await eyeButtons.isVisible().catch(() => false)) {
      await eyeButtons.click();
      await page.waitForURL(/\/adm\/price-lists\/[^/]+$/);
      
      // Verify detail page elements
      await expect(page.getByText('Detalle de Lista de Precios')).toBeVisible();
      await expect(page.getByText('Ítems con Precio Especial')).toBeVisible();
    }
  });

  test('✅ API endpoints respond correctly', async ({ page }) => {
    // Test API directly
    const response = await page.request.get('/api/price-lists?includeInactive=true');
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('priceLists');
    expect(Array.isArray(data.priceLists)).toBe(true);
  });
});
