import { test } from '@playwright/test';

test.describe('Inspección del Importador', () => {
  test('inspeccionar estructura real del importador', async ({ page }) => {
    // Configurar auth
    await page.goto('http://localhost:3000');
    await page.request.post('http://localhost:3000/api/auth/debug', {
      data: { role: 'ADMIN' }
    });
    
    // Navegar al importador
    await page.goto('http://localhost:3000/adm/products/import');
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 Inspeccionando estructura del importador...');
    
    // Capturar screenshot completo
    await page.screenshot({ path: 'test-results/importador-inspection.png', fullPage: true });
    
    // Analizar la estructura
    const content = await page.content();
    console.log('\n📄 Estructura HTML (primeros 1000 caracteres):');
    console.log(content.substring(0, 1000));
    
    // Buscar elementos de upload
    const fileInputs = await page.locator('input[type="file"]').count();
    console.log(`\n📁 Inputs de archivo encontrados: ${fileInputs}`);
    
    // Buscar botones
    const buttons = await page.locator('button').count();
    console.log(`🔘 Botones encontrados: ${buttons}`);
    
    // Listar textos de botones
    for (let i = 0; i < Math.min(buttons, 10); i++) {
      const button = page.locator('button').nth(i);
      const text = await button.textContent();
      console.log(`   - Botón ${i}: "${text}"`);
    }
    
    // Buscar elementos drag & drop
    const dropZones = await page.locator('[data-testid*="drop"], [class*="drop"], [class*="drag"]').count();
    console.log(`\n🎯 Zonas de drag & drop encontradas: ${dropZones}`);
    
    // Buscar formularios
    const forms = await page.locator('form').count();
    console.log(`\n📋 Formularios encontrados: ${forms}`);
    
    // Esperar 5 segundos para inspección manual
    console.log('\n⏱️ Manteniendo página abierta por 5 segundos para inspección...');
    await page.waitForTimeout(5000);
    
    console.log('\n✅ Inspección completada');
  });
});
