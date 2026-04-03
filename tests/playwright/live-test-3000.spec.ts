/**
 * Live Product Importer Test - Port 3000
 */

import { test, expect } from '@playwright/test';

test.describe('Product Importer - Live Test Port 3000', () => {
  test.use({ baseURL: 'http://localhost:3000' });

  test('live navigation and validation', async ({ page }) => {
    console.log('🎬 Starting live test on port 3000...');
    
    // Step 1: Debug Auth
    console.log('🔐 Setting up Debug Auth...');
    await page.goto('/api/auth/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'ADMIN' })
    });
    
    // Step 2: Navigate to importer
    console.log('📤 Navigating to product importer...');
    await page.goto('/adm/products/import');
    await page.waitForTimeout(2000);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/01-initial-state.png', fullPage: true });
    console.log('📸 Screenshot: Initial state captured');
    
    // Step 3: Upload CSV
    console.log('📁 Uploading test CSV...');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles('/Users/cenco/Github/galiprandi/rpm/tests/e2e/product-import-test.csv');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-results/02-after-upload.png', fullPage: true });
    console.log('📸 Screenshot: After upload captured');
    
    // Step 4: Configuration
    console.log('⚙️ Checking configuration step...');
    await page.waitForTimeout(2000);
    
    const continueButton = page.locator('button:has-text("Continuar"), button:has-text("Siguiente")').first();
    const isVisible = await continueButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await continueButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Continued to review step');
    }
    
    await page.screenshot({ path: 'test-results/03-configuration.png', fullPage: true });
    console.log('📸 Screenshot: Configuration captured');
    
    // Step 5: Review results
    console.log('👁️ Reviewing validation results...');
    await page.waitForTimeout(5000); // Wait for API validation
    
    await page.screenshot({ path: 'test-results/04-review-results.png', fullPage: true });
    console.log('📸 Screenshot: Review results captured');
    
    // Look for key elements
    const statsElement = page.locator('text=/Total|Válidos|Inválidos/i').first();
    const hasStats = await statsElement.isVisible().catch(() => false);
    console.log(`📊 Stats visible: ${hasStats ? 'YES' : 'NO'}`);
    
    const productElement = page.locator('text=/ACEITE|ADAPTADOR|DEFLECTOR/i').first();
    const hasProducts = await productElement.isVisible().catch(() => false);
    console.log(`📦 Products visible: ${hasProducts ? 'YES' : 'NO'}`);
    
    // Keep browser open for observation
    console.log('🎯 Test completed. Browser staying open for 30 seconds...');
    await page.waitForTimeout(30000);
    
    console.log('✅ Live test finished');
  });
});
