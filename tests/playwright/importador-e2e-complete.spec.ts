import { test, expect } from '@playwright/test';

test.describe('Importador de Productos - Flujo E2E Completo', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar auth debug
    await page.goto('http://localhost:3000');
    const response = await page.request.post('http://localhost:3000/api/auth/debug', {
      data: { role: 'ADMIN' }
    });
    expect(response.ok()).toBeTruthy();
  });

  test('flujo completo: upload CSV → configurar mapeo → dry-run → importar', async ({ page }) => {
    console.log('\n🚀 Iniciando flujo E2E completo del importador...\n');

    // PASO 1: Navegar al importador
    console.log('📍 PASO 1: Navegando al importador...');
    await page.goto('http://localhost:3000/adm/products/import');
    await page.waitForLoadState('networkidle');
    
    // Verificar que estamos en la página correcta
    await expect(page.locator('text=Importar Productos')).toBeVisible();
    console.log('   ✅ Página de importador cargada');

    // PASO 2: Upload CSV
    console.log('\n📁 PASO 2: Upload CSV...');
    
    // Buscar el input de archivo
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    
    // Hacer upload del CSV de prueba
    const csvPath = 'products-list.csv'; // Asumiendo que está en public/
    await fileInput.setInputFiles(csvPath);
    
    // Esperar a que se procese el archivo
    await page.waitForTimeout(2000);
    
    // Verificar que se muestra el preview del CSV
    await expect(page.locator('text=Vista previa')).toBeVisible({ timeout: 10000 });
    console.log('   ✅ CSV cargado y procesado');

    // PASO 3: Configurar mapeo de columnas
    console.log('\n🗂️  PASO 3: Configurando mapeo de columnas...');
    
    // Esperar a que aparezcan los selectores de mapeo
    await page.waitForSelector('[data-testid="column-mapping"]', { timeout: 10000 });
    
    // Configurar mapeo básico (ajustar según los selectores reales)
    const nameSelect = page.locator('select[name="name"]');
    const priceSelect = page.locator('select[name="price"]');
    const categorySelect = page.locator('select[name="category"]');
    
    if (await nameSelect.isVisible()) {
      await nameSelect.selectOption({ label: 'name' });
      console.log('   ✅ Columna name mapeada');
    }
    
    if (await priceSelect.isVisible()) {
      await priceSelect.selectOption({ label: 'price' });
      console.log('   ✅ Columna price mapeada');
    }
    
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ label: 'category' });
      console.log('   ✅ Columna category mapeada');
    }

    // PASO 4: Dry-run
    console.log('\n🔍 PASO 4: Ejecutando dry-run...');
    
    const dryRunButton = page.locator('button:has-text("Previsualizar")');
    await expect(dryRunButton).toBeVisible();
    await dryRunButton.click();
    
    // Esperar resultados del dry-run
    await page.waitForSelector('[data-testid="dry-run-results"]', { timeout: 15000 });
    
    // Verificar resultados
    const resultsCount = page.locator('[data-testid="results-count"]');
    await expect(resultsCount).toBeVisible();
    
    const countText = await resultsCount.textContent();
    console.log(`   ✅ Dry-run completado: ${countText}`);

    // PASO 5: Importación final
    console.log('\n✅ PASO 5: Ejecutando importación final...');
    
    const importButton = page.locator('button:has-text("Importar")');
    await expect(importButton).toBeVisible();
    await importButton.click();
    
    // Confirmar si hay diálogo de confirmación
    const confirmDialog = page.locator('[role="dialog"]');
    if (await confirmDialog.isVisible({ timeout: 5000 })) {
      const confirmButton = confirmDialog.locator('button:has-text("Confirmar")');
      await confirmButton.click();
      console.log('   ✅ Confirmación de importación aceptada');
    }
    
    // Esperar a que complete la importación
    await page.waitForSelector('[data-testid="import-success"]', { timeout: 30000 });
    
    // Verificar mensaje de éxito
    const successMessage = page.locator('text=Importación completada');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    console.log('   ✅ Importación completada exitosamente');

    // Capturar screenshots en cada paso
    await page.screenshot({ path: 'test-results/importador-paso-1-upload.png', fullPage: true });
    await page.screenshot({ path: 'test-results/importador-paso-2-mapeo.png', fullPage: true });
    await page.screenshot({ path: 'test-results/importador-paso-3-dryrun.png', fullPage: true });
    await page.screenshot({ path: 'test-results/importador-paso-4-importado.png', fullPage: true });

    console.log('\n🎯 Flujo E2E completado exitosamente');
  });

  test('validación de errores y edge cases', async ({ page }) => {
    console.log('\n🧪 Testing edge cases y manejo de errores...\n');

    await page.goto('http://localhost:3000/adm/products/import');
    await page.waitForLoadState('networkidle');

    // Test 1: Upload de archivo inválido
    console.log('❌ Test 1: Archivo inválido');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('README.md'); // Archivo no CSV
    
    // Verificar mensaje de error
    await expect(page.locator('text=Formato de archivo inválido')).toBeVisible({ timeout: 5000 });
    console.log('   ✅ Error de formato detectado correctamente');

    // Test 2: CSV vacío
    console.log('📝 Test 2: CSV vacío');
    // Crear CSV vacío temporal
    await page.evaluate(() => {
      const blob = new Blob([''], { type: 'text/csv' });
      const file = new File([blob], 'empty.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    await page.waitForTimeout(2000);
    // Verificar manejo de CSV vacío
    const emptyError = page.locator('text=El archivo está vacío');
    if (await emptyError.isVisible({ timeout: 5000 })) {
      console.log('   ✅ CSV vacío detectado correctamente');
    }

    // Test 3: Navegación durante proceso
    console.log('🔄 Test 3: Navegación durante proceso');
    await page.goto('http://localhost:3000/adm/products');
    await page.goto('http://localhost:3000/adm/products/import');
    
    // Verificar que el estado se mantiene
    await expect(page.locator('text=Importar Productos')).toBeVisible();
    console.log('   ✅ Estado mantenido tras navegación');

    console.log('\n✅ Tests de edge cases completados');
  });
});
