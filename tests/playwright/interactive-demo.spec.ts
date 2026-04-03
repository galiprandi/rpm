/**
 * Interactive Browser Test - Live Navigation
 * 
 * Este test abre un browser y navega paso a paso
 * para que puedas observar el flujo en tiempo real.
 */

import { test } from '@playwright/test';

test.describe('Interactive Product Importer Demo', () => {
  test.use({ 
    baseURL: 'http://localhost:3333',
    viewport: { width: 1280, height: 720 }
  });

  test('live navigation demo - OBSERVE ONLY', async ({ page }) => {
    console.log('🎬 Starting live navigation demo...');
    
    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigating to login...');
    await page.goto('/login');
    await page.waitForTimeout(2000); // Pause for observation
    
    // Step 2: Try Debug Auth login
    console.log('🔐 Step 2: Attempting Debug Auth login...');
    try {
      await page.goto('/adm/products/import');
      await page.waitForTimeout(3000); // Pause for observation
    } catch (error) {
      console.log('⚠️ Debug Auth failed, trying manual navigation...');
      await page.goto('http://localhost:3333/api/auth/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'ADMIN' })
      });
      await page.waitForTimeout(2000);
      await page.goto('/adm/products/import');
      await page.waitForTimeout(3000);
    }
    
    // Step 3: Observe the import page
    console.log('📤 Step 3: Observing import page...');
    await page.waitForTimeout(3000); // Pause for observation
    
    // Step 4: Try to upload file
    console.log('📁 Step 4: Attempting file upload...');
    const fileInput = page.locator('input[type="file"]').first();
    const isVisible = await fileInput.isVisible().catch(() => false);
    
    if (isVisible) {
      console.log('✅ File input found, attempting upload...');
      // Try to upload test file
      const testFilePath = '/Users/cenco/Github/galiprandi/rpm/tests/e2e/product-import-test.csv';
      await fileInput.setInputFiles(testFilePath);
      await page.waitForTimeout(5000); // Pause for observation
    } else {
      console.log('❌ File input not found');
    }
    
    // Step 5: Look for configuration step
    console.log('⚙️ Step 5: Looking for configuration step...');
    await page.waitForTimeout(3000);
    
    // Step 6: Look for review step
    console.log('👁️ Step 6: Looking for review step...');
    await page.waitForTimeout(3000);
    
    // Keep browser open for observation
    console.log('🎯 Demo completed. Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);
    
    console.log('✅ Live navigation demo finished');
  });
});
