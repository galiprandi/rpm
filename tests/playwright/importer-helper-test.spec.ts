/**
 * Product Importer Test - Using Official loginAs Helper
 */

import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Product Importer - Official Helper', () => {
  test.use({ baseURL: 'http://localhost:3000' });

  test('should access importer with loginAs helper', async ({ page }) => {
    console.log('🔐 Using official loginAs helper...');
    
    // Step 1: Login with official helper (includes page.reload())
    await loginAs(page, 'ADMIN');
    console.log('✅ Logged in as ADMIN');
    
    // Step 2: Navigate to importer
    console.log('📤 Navigating to product importer...');
    await page.goto('/adm/products/import');
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/importer-with-helper.png', fullPage: true });
    console.log('📸 Screenshot captured');
    
    // Check if we're on the importer page
    const title = page.locator('text=Importar Productos').first();
    const hasTitle = await title.isVisible().catch(() => false);
    
    console.log(`🎯 Importer page loaded: ${hasTitle ? 'YES' : 'NO'}`);
    
    if (hasTitle) {
      console.log('🎉 SUCCESS: Debug Auth bypass working!');
      
      // Look for upload elements
      const dropzone = page.locator('text=Arrastra un archivo CSV aquí').first();
      const hasDropzone = await dropzone.isVisible().catch(() => false);
      console.log(`📤 Dropzone visible: ${hasDropzone ? 'YES' : 'NO'}`);
      
      // Look for file input
      const fileInput = page.locator('input[type="file"]').first();
      const hasFileInput = await fileInput.isVisible().catch(() => false);
      console.log(`📁 File input visible: ${hasFileInput ? 'YES' : 'NO'}`);
      
    } else {
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);
    }
    
    // Keep browser open for observation
    console.log('🎯 Keeping browser open for 30 seconds...');
    await page.waitForTimeout(30000);
    
    console.log('✅ Test completed');
  });
});
