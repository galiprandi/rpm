import { test, expect } from '@playwright/test';

test('final verification', async ({ page }) => {
  await page.goto('http://localhost:6006/iframe.html?id=ui-productserviceselector--default');
  const trashBtn = page.locator('button[aria-label="Quitar de la lista"]');
  await expect(trashBtn).toBeVisible();
  await trashBtn.hover();
  await expect(page.locator('text=Quitar de la lista')).toBeVisible();
  await page.screenshot({ path: 'final-ux-verification.png' });
});
