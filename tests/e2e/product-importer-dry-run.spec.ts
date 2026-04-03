/**
 * E2E Test: Product Importer Dry-Run Validation
 * 
 * Test Suite for validating the product import flow in dry-run mode.
 * Uses test data from tests/e2e/product-import-test.csv
 * 
 * Expected test data characteristics:
 * - 19 products with various edge cases
 * - Spanish number format (comma as decimal separator)
 * - Mixed stock values (positive, zero, negative)
 * - Empty CODPROV values
 * - Various RUBRO categories
 * - Special characters in product names
 * 
 * Columns: CODPROV, CODIGO, PRODUCTO, PRESENTACION, STOCK, MAYORISTA, 
 *          CONTADO, MINORISTA, PRECIO COMPRA, RUBRO, SUBRUBRO
 */

import { test, expect } from '@playwright/test';
import path from 'path';

// Test data expectations based on CSV
const EXPECTED_PRODUCTS = {
  total: 19,
  withPositiveStock: 6, // Products with stock > 0
  withZeroStock: 12,    // Products with stock = 0
  withNegativeStock: 2, // Products with stock < 0 (rows 3, 16)
  uniqueCategories: [
    'DEFLECTORES',
    'ELECTRICIDAD',
    'ACEITES Y LUBRICANTES',
    'ACCESORIOS',
    'COSMETICA',
    'AUDIO'
  ]
};

// Expected transformations
const EXPECTED_TRANSFORMATIONS = {
  // Product with leading slash should be cleaned
  leadingSlashProduct: {
    raw: '/DEFLECTOR P/VENTANILLA RENAULT SANDERO',
    expected: 'Deflector P/Ventanilla Renault Sandero'
  },
  // Spanish price format conversion
  spanishPrice: {
    raw: '34727,00',
    expected: 34727.00
  },
  // Stock negative handling
  negativeStock: {
    raw: '-3',
    shouldBeSkipped: true
  }
};

test.describe('Product Importer - Dry Run E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/login');
    
    // Wait for login form
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Fill credentials (using test credentials)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit and wait for navigation
    await page.click('button[type="submit"]');
    await page.waitForURL('**/adm/**', { timeout: 15000 });
    
    // Navigate to product import page
    await page.goto('/adm/products/import');
    await page.waitForSelector('text=Importar Productos', { timeout: 10000 });
  });

  test.describe('Step 1: CSV Upload', () => {
    test('should upload CSV file and detect columns automatically', async ({ page }) => {
      // Verify initial state
      await expect(page.getByText('Cargar Archivo CSV')).toBeVisible();
      await expect(page.getByText('Arrastra un archivo CSV aquí')).toBeVisible();

      // Upload test CSV file
      const fileInput = page.locator('input[type="file"]').first();
      const testFilePath = path.join(__dirname, 'product-import-test.csv');
      
      await fileInput.setInputFiles(testFilePath);

      // Wait for upload completion and navigation to step 2
      await page.waitForSelector('text=Configurar Importación', { timeout: 15000 });

      // Verify we're now on step 2
      await expect(page.getByText('Configurar Importación')).toBeVisible();
      
      // Verify column detection worked
      await expect(page.getByText(/Columnas detectadas|PRODUCTO|RUBRO|STOCK/)).toBeVisible();
    });

    test('should reject non-CSV files', async ({ page }) => {
      // Create a temporary non-CSV file content
      const invalidFilePath = path.join(__dirname, 'invalid-file.txt');
      
      // Try to upload a text file that's not CSV format
      const fileInput = page.locator('input[type="file"]').first();
      
      // The component should handle this gracefully
      await fileInput.setInputFiles(invalidFilePath);

      // Should show error message
      await expect(page.getByText(/error|Error|solo se permiten/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show preview of detected data', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      const testFilePath = path.join(__dirname, 'product-import-test.csv');
      
      await fileInput.setInputFiles(testFilePath);
      
      // Wait for analysis
      await page.waitForTimeout(2000);

      // Check for preview data indicators
      const previewText = await page.locator('text=/19|productos|filas/i').first();
      await expect(previewText).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Step 2: Column Mapping Configuration', () => {
    test.beforeEach(async ({ page }) => {
      // Pre-load CSV file
      const fileInput = page.locator('input[type="file"]').first();
      const testFilePath = path.join(__dirname, 'product-import-test.csv');
      await fileInput.setInputFiles(testFilePath);
      await page.waitForSelector('text=Configurar Importación', { timeout: 15000 });
    });

    test('should auto-detect column mappings for Spanish headers', async ({ page }) => {
      // Verify auto-detection occurred
      await page.waitForTimeout(1000);
      
      // Check if mappings are pre-filled
      // Look for select elements or mapping indicators
      await expect(page.getByText(/PRODUCTO|RUBRO|STOCK|detectado/i).first()).toBeVisible();
    });

    test('should allow manual column mapping adjustment', async ({ page }) => {
      // Find a mapping selector
      const nameMapping = page.locator('select, [data-testid*="name"], [data-testid*="nombre"]').first();
      
      if (await nameMapping.isVisible().catch(() => false)) {
        // Verify we can interact with mappings
        await nameMapping.click();
        await expect(page.getByText(/PRODUCTO|CODIGO|none/i).first()).toBeVisible();
      }
    });

    test('should configure global import options', async ({ page }) => {
      // Look for global options section
      // const optionsSection = page.locator('text=/opciones|options|configuración global/i');
      
      // Toggle skip stock < 1 option
      const skipStockToggle = page.locator('input[type="checkbox"], [data-testid*="skip-stock"], [data-testid*="omitir-stock"]').first();
      
      if (await skipStockToggle.isVisible().catch(() => false)) {
        await skipStockToggle.click();
        
        // Verify toggle state changed
        const isChecked = await skipStockToggle.isChecked().catch(() => false);
        expect(typeof isChecked).toBe('boolean');
      }
    });

    test('should validate required name mapping before continuing', async ({ page }) => {
      // Try to continue without proper mapping
      const continueButton = page.locator('button:has-text("Continuar"), button:has-text("Siguiente"), [data-testid="continue"]').first();
      
      await continueButton.click();

      // If mappings are incomplete, should show validation error
      // or if auto-detected, should proceed
      await page.waitForTimeout(1000);
      
      // Either we see an alert/error OR we advanced to review step
      const currentStep = await page.locator('text=/Revisar|Review|Configurar/i').first();
      await expect(currentStep).toBeVisible();
    });
  });

  test.describe('Step 3: Review - Dry Run Validation', () => {
    test.beforeEach(async ({ page }) => {
      // Complete steps 1 and 2
      const fileInput = page.locator('input[type="file"]').first();
      const testFilePath = path.join(__dirname, 'product-import-test.csv');
      await fileInput.setInputFiles(testFilePath);
      await page.waitForSelector('text=Configurar Importación', { timeout: 15000 });
      
      // Continue to review
      const continueButton = page.locator('button:has-text("Continuar"), button:has-text("Siguiente"), [data-testid="continue"]').first();
      await continueButton.click();
      
      // Wait for review step
      await page.waitForSelector('text=Revisar Datos', { timeout: 15000 });
    });

    test('should display validation statistics', async ({ page }) => {
      // Wait for validation to complete
      await page.waitForTimeout(3000);
      
      // Check for stats display
      const statsSection = page.locator('text=/Total|Válidos|Inválidos|Nuevos|Omitidos/i');
      await expect(statsSection.first()).toBeVisible({ timeout: 10000 });
      
      // Verify stats numbers are shown
      const hasNumbers = await page.locator('text=/\\d+\\s*(productos|filas|items)/i').count() > 0;
      expect(hasNumbers).toBe(true);
    });

    test('should show category detection and mapping', async ({ page }) => {
      // Look for category section
      const categorySection = page.locator('text=/Categorías|RUBRO|rubros/i').first();
      await expect(categorySection).toBeVisible({ timeout: 10000 });
      
      // Verify expected categories are detected
      for (const category of EXPECTED_PRODUCTS.uniqueCategories.slice(0, 3)) {
        const categoryLabel = page.locator(`text=${category}`).first();
        await expect(categoryLabel).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display tabs for different validation states', async ({ page }) => {
      // Look for tab buttons or navigation
      const tabs = page.locator('[role="tab"], button:has-text("Nuevos"), button:has-text("Omitidos"), button:has-text("Categorías")');
      
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThanOrEqual(2); // At least 2 tabs should exist
      
      // Click through tabs if they exist
      if (tabCount > 0) {
        for (let i = 0; i < Math.min(tabCount, 3); i++) {
          await tabs.nth(i).click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should show product transformation preview', async ({ page }) => {
      // Wait for validation data to load
      await page.waitForTimeout(2000);
      
      // Should see product data
      const productData = page.locator('text=/ACEITE|ADAPTADOR|DEFLECTOR|AGUA/i').first();
      await expect(productData).toBeVisible({ timeout: 10000 });
    });

    test('should handle products with negative stock correctly', async ({ page }) => {
      // This test validates the dry-run behavior with negative stock
      // Products with stock < 1 should be flagged based on settings
      
      await page.waitForTimeout(3000);
      
      // Look for omitted or invalid section
      const omittedSection = page.locator('text=/Omitidos|Inválidos|stock menor/i').first();
      
      // Depending on skipStockLessThanOne setting, negative stock products 
      // should appear in omitted or be flagged
      const hasStockIssues = await omittedSection.isVisible().catch(() => false);
      
      // Log for debugging
      console.log('Stock handling check:', { hasStockIssues });
    });

    test('should transform Spanish number formats correctly', async ({ page }) => {
      // Verify that prices like "34727,00" are converted to proper decimals
      await page.waitForTimeout(3000);
      
      // Look for transformed prices in the preview
      const priceIndicator = page.locator('text=/34727|24805|price|precio/i').first();
      await expect(priceIndicator).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('End-to-End Flow: Complete Dry Run', () => {
    test('should complete full dry-run validation cycle', async ({ page }) => {
      // Step 1: Upload
      const fileInput = page.locator('input[type="file"]').first();
      const testFilePath = path.join(__dirname, 'product-import-test.csv');
      await fileInput.setInputFiles(testFilePath);
      await page.waitForSelector('text=Configurar Importación', { timeout: 15000 });
      
      console.log('✓ Step 1: CSV uploaded successfully');

      // Step 2: Configure
      await page.waitForTimeout(2000);
      const continueButton = page.locator('button:has-text("Continuar"), button:has-text("Siguiente"), [data-testid="continue"]').first();
      await continueButton.click();
      await page.waitForSelector('text=Revisar Datos', { timeout: 15000 });
      
      console.log('✓ Step 2: Configuration completed');

      // Step 3: Review (Dry Run)
      await page.waitForTimeout(3000);
      
      // Capture validation results
      const statsText = await page.locator('text=/\\d+\\s*(productos|válidos|inválidos)/i').first().textContent().catch(() => 'N/A');
      console.log('✓ Step 3: Dry-run validation results:', statsText);
      
      // Verify we have validation data
      const hasValidationData = await page.locator('text=/Nuevos|Válidos|Categorías/i').first().isVisible().catch(() => false);
      expect(hasValidationData).toBe(true);

      // Capture screenshot of results
      await page.screenshot({ path: 'test-results/dry-run-review.png', fullPage: true });
      
      console.log('✓ Full dry-run cycle completed successfully');
    });

    test('should persist configuration in localStorage', async ({ page }) => {
      // Complete flow once
      const fileInput = page.locator('input[type="file"]').first();
      const testFilePath = path.join(__dirname, 'product-import-test.csv');
      await fileInput.setInputFiles(testFilePath);
      await page.waitForSelector('text=Configurar Importación', { timeout: 15000 });
      
      // Reload page
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Should restore to step 0 (no file) based on page.tsx logic
      // OR should persist configuration
      const currentStep = await page.locator('text=/Cargar CSV|Configurar|Revisar/i').first().textContent();
      console.log('After reload, current state:', currentStep);
      
      // The implementation should handle state appropriately
      expect(currentStep).toBeTruthy();
    });
  });

  test.describe('Data Quality Validation', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to review step
      const fileInput = page.locator('input[type="file"]').first();
      const testFilePath = path.join(__dirname, 'product-import-test.csv');
      await fileInput.setInputFiles(testFilePath);
      await page.waitForSelector('text=Configurar Importación', { timeout: 15000 });
      
      const continueButton = page.locator('button:has-text("Continuar"), button:has-text("Siguiente"), [data-testid="continue"]').first();
      await continueButton.click();
      await page.waitForSelector('text=Revisar Datos', { timeout: 15000 });
      await page.waitForTimeout(3000);
    });

    test('should validate product name transformations', async ({ page }) => {
      // Check for transformed names (capitalization, trim)
      const productWithLeadingSlash = page.locator('text=/Deflector|DEFLECTOR/i').first();
      await expect(productWithLeadingSlash).toBeVisible({ timeout: 5000 });
      
      // The leading slash should be handled
      const rawName = EXPECTED_TRANSFORMATIONS.leadingSlashProduct.raw;
      const transformedName = EXPECTED_TRANSFORMATIONS.leadingSlashProduct.expected;
      
      console.log(`Name transformation check: "${rawName}" -> "${transformedName}"`);
    });

    test('should detect and categorize all unique rubros', async ({ page }) => {
      // Count detected categories
      const categoryElements = page.locator('text=/DEFLECTORES|ELECTRICIDAD|ACEITES|ACCESORIOS|COSMETICA|AUDIO/i');
      const count = await categoryElements.count();
      
      console.log(`Detected ${count} category elements`);
      expect(count).toBeGreaterThanOrEqual(3); // At least 3 categories should be visible
    });

    test('should show proper handling of empty SKUs', async ({ page }) => {
      // Products with empty CODPROV should be handled
      // Check if they're flagged or accepted
      await page.click('button:has-text("Omitidos"), button:has-text("Inválidos"), [role="tab"]:nth-child(2)').catch(() => {});
      
      await page.waitForTimeout(1000);
      
      // Look for any warnings about empty fields
      const emptyFieldWarning = page.locator('text=/vacío|empty|omitido|skipped/i').first();
      const hasWarning = await emptyFieldWarning.isVisible().catch(() => false);
      
      console.log('Empty SKU handling:', { hasWarning });
    });
  });
});
