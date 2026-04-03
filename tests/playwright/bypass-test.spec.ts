/**
 * Debug Auth Bypass Test - Direct Navigation
 */

import { test } from '@playwright/test';

test.describe('Debug Auth Bypass Validation', () => {
  test.use({ baseURL: 'http://localhost:3000' });

  test('bypass should work directly', async ({ page }) => {
    console.log('🔐 Testing Debug Auth Bypass...');
    
    // Step 1: Create debug session
    console.log('📝 Creating debug session...');
    const response = await page.request.post('/api/auth/debug', {
      data: { role: 'ADMIN' }
    });
    
    const sessionData = await response.json();
    console.log('✅ Debug session created:', sessionData.user.name);
    
    // Step 2: Navigate directly to importer (no login needed)
    console.log('📤 Navigating directly to importer...');
    await page.goto('/adm/products/import');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/bypass-direct.png', fullPage: true });
    console.log('📸 Screenshot captured');
    
    // Check if we're on the importer page
    const title = page.locator('text=Importar Productos').first();
    const hasTitle = await title.isVisible().catch(() => false);
    
    console.log(`🎯 Importer page loaded: ${hasTitle ? 'YES' : 'NO'}`);
    
    // If not on importer, check where we are
    if (!hasTitle) {
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);
      
      // Check if we're on login page
      const isLogin = currentUrl.includes('/login');
      console.log(`🔑 Redirected to login: ${isLogin ? 'YES' : 'NO'}`);
    }
    
    // Keep browser open for observation
    console.log('🎯 Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    
    console.log('✅ Bypass test completed');
  });
});
