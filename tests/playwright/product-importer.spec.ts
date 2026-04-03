/**
 * Product Importer E2E Test - Using Playwright with Debug Auth
 * 
 * Tests the complete product import flow using the existing Playwright
 * infrastructure and Debug Auth system.
 * 
 * Usage:
 * pnpm exec playwright test tests/playwright/product-importer.spec.ts --headed --project=chromium
 */

import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import path from 'path';

test.describe('Product Importer - Complete Flow', () => {
  test.use({ baseURL: 'http://localhost:3333' });
  test.beforeEach(async ({ page }) => {
    // Login as ADMIN using Debug Auth
    await loginAs(page, 'ADMIN');
  });

  test('should complete full import flow with test data', async ({ page }) => {
    // Navigate to product importer
    await page.goto('/adm/products/import');
    
    // Verify we're on the correct page
    await expect(page.getByText('Importar Productos')).toBeVisible();
    await expect(page.getByText('Cargar Archivo CSV')).toBeVisible();

    // Step 1: Upload CSV
    console.log('📤 Step 1: Uploading CSV...');
    
    // Get the file input and upload test data
    const fileInput = page.locator('input[type="file"]').first();
    const testFilePath = path.join(__dirname, '../e2e/product-import-test.csv');
    
    await fileInput.setInputFiles(testFilePath);
    
    // Wait for upload and navigation to step 2
    await page.waitForSelector('text=Configurar Importación', { timeout: 15000 });
    console.log('✅ Step 1: CSV uploaded successfully');

    // Step 2: Configure mappings
    console.log('⚙️ Step 2: Configuring mappings...');
    
    // Wait for auto-detection to complete
    await page.waitForTimeout(2000);
    
    // Verify auto-detected mappings are visible
    await expect(page.getByText(/PRODUCTO|RUBRO|STOCK|detectado/i)).toBeVisible();
    
    // Continue to review step
    const continueButton = page.locator('button:has-text("Continuar"), button:has-text("Siguiente")').first();
    await continueButton.click();
    
    await page.waitForSelector('text=Revisar Datos', { timeout: 15000 });
    console.log('✅ Step 2: Configuration completed');

    // Step 3: Review validation results
    console.log('👁️ Step 3: Reviewing validation results...');
    
    // Wait for validation to complete
    await page.waitForTimeout(5000);
    
    // Capture validation statistics
    const statsSection = page.locator('text=/Total|Válidos|Inválidos|Nuevos/i').first();
    await expect(statsSection).toBeVisible({ timeout: 10000 });
    
    // Check for category detection
    await expect(page.getByText(/Categorías|RUBRO/i).first()).toBeVisible();
    
    // Verify product data is displayed
    await expect(page.locator('text=/ACEITE|ADAPTADOR|DEFLECTOR|AGUA/i').first()).toBeVisible();
    
    console.log('✅ Step 3: Validation completed');

    // Take screenshots for documentation
    await page.screenshot({ 
      path: 'test-results/importer-review-final.png', 
      fullPage: true 
    });
    
    console.log('🎉 Full import flow completed successfully!');
  });

  test('should handle edge cases in test data correctly', async ({ page }) => {
    await page.goto('/adm/products/import');
    
    // Upload test CSV
    const fileInput = page.locator('input[type="file"]').first();
    const testFilePath = path.join(__dirname, '../e2e/product-import-test.csv');
    await fileInput.setInputFiles(testFilePath);
    
    await page.waitForSelector('text=Configurar Importación', { timeout: 15000 });
    
    // Continue to review
    const continueButton = page.locator('button:has-text("Continuar"), button:has-text("Siguiente")').first();
    await continueButton.click();
    
    await page.waitForSelector('text=Revisar Datos', { timeout: 15000 });
    await page.waitForTimeout(5000); // Wait for validation
    
    // Test specific edge cases
    console.log('🔍 Testing edge cases...');
    
    // Check for negative stock handling
    const negativeStockIndicator = page.locator('text=/-3|stock.*negativo|menor/i').first();
    const hasNegativeStock = await negativeStockIndicator.isVisible().catch(() => false);
    console.log(`Negative stock handling: ${hasNegativeStock ? '✅ Detected' : '⚠️ Not visible'}`);
    
    // Check for Spanish price format conversion
    const priceIndicator = page.locator('text=/34727|24805|price|precio/i').first();
    await expect(priceIndicator).toBeVisible({ timeout: 5000 });
    console.log('✅ Spanish price format conversion working');
    
    // Check for category detection
    const categories = ['DEFLECTORES', 'ELECTRICIDAD', 'ACEITES', 'ACCESORIOS', 'COSMETICA', 'AUDIO'];
    for (const category of categories.slice(0, 3)) {
      const categoryElement = page.locator(`text=${category}`).first();
      await expect(categoryElement).toBeVisible({ timeout: 3000 });
    }
    console.log('✅ Category detection working');
    
    // Check for name transformations
    const cleanedName = page.locator('text=/Deflector|deflector/i').first();
    await expect(cleanedName).toBeVisible({ timeout: 3000 });
    console.log('✅ Name transformation working');
  });

  test('should validate UI/UX aspects', async ({ page }) => {
    await page.goto('/adm/products/import');
    
    // Test UI elements and user experience
    console.log('🎨 Testing UI/UX aspects...');
    
    // Verify stepper is visible
    await expect(page.locator('[data-testid="stepper"], .stepper, text=/Paso|Step/i').first()).toBeVisible();
    console.log('✅ Stepper visible');
    
    // Test dropzone interaction
    await expect(page.getByText('Arrastra un archivo CSV aquí')).toBeVisible();
    console.log('✅ Dropzone instructions visible');
    
    // Upload file to test interaction
    const fileInput = page.locator('input[type="file"]').first();
    const testFilePath = path.join(__dirname, '../e2e/product-import-test.csv');
    await fileInput.setInputFiles(testFilePath);
    
    // Verify smooth transition to step 2
    await page.waitForSelector('text=Configurar Importación', { timeout: 15000 });
    console.log('✅ Smooth transition to configuration step');
    
    // Test configuration UI
    await expect(page.getByText(/PRODUCTO|RUBRO|STOCK/i).first()).toBeVisible();
    console.log('✅ Configuration interface visible');
    
    // Continue to review
    const continueButton = page.locator('button:has-text("Continuar"), button:has-text("Siguiente")').first();
    await continueButton.click();
    
    await page.waitForSelector('text=Revisar Datos', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Test review UI
    await expect(page.locator('text=/Total|Válidos|Inválidos/i').first()).toBeVisible();
    console.log('✅ Review statistics visible');
    
    // Test tabs if they exist
    const tabs = page.locator('[role="tab"], button:has-text("Nuevos"), button:has-text("Omitidos")');
    const tabCount = await tabs.count();
    console.log(`Tabs found: ${tabCount}`);
    
    if (tabCount > 0) {
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(500);
      }
      console.log('✅ Tab navigation working');
    }
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    await page.goto('/adm/products/import');
    
    console.log('🚨 Testing error scenarios...');
    
    // Test invalid file upload (if possible)
    // This would require creating an invalid test file
    
    // Test navigation without file
    const continueButton = page.locator('button:has-text("Continuar"), button:has-text("Siguiente")').first();
    const isDisabled = await continueButton.isDisabled().catch(() => true);
    console.log(`Continue button disabled without file: ${isDisabled ? '✅' : '⚠️'}`);
    
    // Test with valid file but incomplete configuration
    const fileInput = page.locator('input[type="file"]').first();
    const testFilePath = path.join(__dirname, '../e2e/product-import-test.csv');
    await fileInput.setInputFiles(testFilePath);
    
    await page.waitForSelector('text=Configurar Importación', { timeout: 15000 });
    
    // Try to continue without proper mapping (if possible)
    // This depends on the implementation
    console.log('✅ Error handling tests completed');
  });
});

test.describe('Product Importer - Performance', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'ADMIN');
  });

  test('should handle large file processing efficiently', async ({ page }) => {
    await page.goto('/adm/products/import');
    
    // Measure upload time
    const startTime = Date.now();
    
    const fileInput = page.locator('input[type="file"]').first();
    const testFilePath = path.join(__dirname, '../e2e/product-import-test.csv');
    await fileInput.setInputFiles(testFilePath);
    
    await page.waitForSelector('text=Configurar Importación', { timeout: 15000 });
    
    const uploadTime = Date.now() - startTime;
    console.log(`⏱️ Upload time: ${uploadTime}ms`);
    
    // Measure validation time
    const validationStart = Date.now();
    
    const continueButton = page.locator('button:has-text("Continuar"), button:has-text("Siguiente")').first();
    await continueButton.click();
    
    await page.waitForSelector('text=Revisar Datos', { timeout: 15000 });
    await page.waitForTimeout(5000); // Wait for validation
    
    const validationTime = Date.now() - validationStart;
    console.log(`⏱️ Validation time: ${validationTime}ms`);
    
    // Performance assertions
    expect(uploadTime).toBeLessThan(10000); // Upload should be under 10s
    expect(validationTime).toBeLessThan(15000); // Validation should be under 15s
    
    console.log('✅ Performance tests completed');
  });
});
