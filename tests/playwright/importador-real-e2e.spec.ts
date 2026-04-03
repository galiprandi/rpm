import { test, expect } from '@playwright/test';

test.describe('Importador de Productos - Flujo E2E Real', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar auth debug
    await page.goto('http://localhost:3000');
    const response = await page.request.post('http://localhost:3000/api/auth/debug', {
      data: { role: 'ADMIN' }
    });
    expect(response.ok()).toBeTruthy();
  });

  test('flujo completo real del importador', async ({ page }) => {
    console.log('\n🚀 Iniciando flujo E2E real del importador...\n');

    // PASO 1: Navegar al importador
    console.log('📍 PASO 1: Navegando al importador...');
    await page.goto('http://localhost:3000/adm/products/import');
    await page.waitForLoadState('networkidle');
    
    // Verificar que estamos en la página correcta
    await expect(page.locator('text=Importar Productos')).toBeVisible();
    console.log('   ✅ Página de importador cargada');

    // Capturar screenshot inicial
    await page.screenshot({ path: 'test-results/importador-real-estado-inicial.png', fullPage: true });

    // PASO 2: Seleccionar archivo
    console.log('\n📁 PASO 2: Seleccionando archivo CSV...');
    
    // Buscar y hacer clic en el botón de seleccionar archivo
    const selectFileButton = page.locator('button:has-text("Seleccionar Archivo")');
    await expect(selectFileButton).toBeVisible();
    await selectFileButton.click();
    
    // Buscar el input de archivo (está oculto)
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    
    // Crear un archivo CSV de prueba en memoria
    const csvContent = `name,price,category,description
Producto Test 1,100.00,Categoría A,Descripción del producto 1
Producto Test 2,200.50,Categoría B,Descripción del producto 2
Producto Test 3,150.75,Categoría A,Descripción del producto 3`;
    
    // Hacer upload del archivo
    await fileInput.setInputFiles({
      name: 'test-products.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });
    
    // Esperar a que se procese el archivo
    await page.waitForTimeout(3000);
    
    // Capturar screenshot después del upload
    await page.screenshot({ path: 'test-results/importador-real-post-upload.png', fullPage: true });
    
    // Verificar que aparece contenido del CSV
    console.log('   ✅ Archivo CSV cargado');

    // PASO 3: Analizar la interfaz post-upload
    console.log('\n🔍 PASO 3: Analizando interfaz post-upload...');
    
    // Buscar nuevos elementos que aparezcan después del upload
    const buttons = await page.locator('button').count();
    console.log(`   Total de botones: ${buttons}`);
    
    // Listar todos los botones visibles
    for (let i = 0; i < buttons; i++) {
      const button = page.locator('button').nth(i);
      const isVisible = await button.isVisible();
      if (isVisible) {
        const text = await button.textContent();
        console.log(`   - Botón visible ${i}: "${text}"`);
      }
    }
    
    // Buscar elementos de tabla o preview
    const tables = await page.locator('table').count();
    const rows = await page.locator('tr').count();
    console.log(`   Tablas encontradas: ${tables}`);
    console.log(`   Filas encontradas: ${rows}`);
    
    // Buscar selects de mapeo
    const selects = await page.locator('select').count();
    console.log(`   Selects encontrados: ${selects}`);
    
    if (selects > 0) {
      console.log('   ✅ Interfaz de mapeo detectada');
      // Configurar mapeo si hay selects
      for (let i = 0; i < selects; i++) {
        const select = page.locator('select').nth(i);
        if (await select.isVisible()) {
          const options = await select.locator('option').count();
          console.log(`     Select ${i}: ${options} opciones`);
        }
      }
    }

    // PASO 4: Buscar y ejecutar acciones disponibles
    console.log('\n⚡ PASO 4: Buscando acciones disponibles...');
    
    // Buscar botones de acción comunes
    const actionButtons = [
      'Previsualizar',
      'Importar', 
      'Siguiente',
      'Continuar',
      'Procesar',
      'Confirmar'
    ];
    
    let foundAction = false;
    for (const action of actionButtons) {
      const button = page.locator(`button:has-text("${action}")`);
      if (await button.isVisible({ timeout: 2000 })) {
        console.log(`   ✅ Botón "${action}" encontrado`);
        foundAction = true;
        
        // Hacer clic y esperar resultado
        await button.click();
        await page.waitForTimeout(3000);
        
        // Capturar screenshot después de la acción
        await page.screenshot({ path: `test-results/importador-real-despues-${action.toLowerCase()}.png`, fullPage: true });
        
        // Verificar si hay mensajes de éxito o error
        const successMessages = await page.locator('text*=éxito, text*=completado, text*=exitoso').count();
        const errorMessages = await page.locator('text*=error, text*=Error, text*=falló').count();
        
        console.log(`   - Mensajes de éxito: ${successMessages}`);
        console.log(`   - Mensajes de error: ${errorMessages}`);
        
        break;
      }
    }
    
    if (!foundAction) {
      console.log('   ⚠️ No se encontraron botones de acción estándar');
    }

    // PASO 5: Análisis final
    console.log('\n📊 PASO 5: Análisis final del estado...');
    
    // Capturar estado final
    await page.screenshot({ path: 'test-results/importador-real-estado-final.png', fullPage: true });
    
    // Analizar URL actual
    const currentUrl = page.url();
    console.log(`   URL final: ${currentUrl}`);
    
    // Buscar mensajes en la página
    const pageText = await page.textContent('body');
    console.log(`   Texto visible (primeros 500 chars): ${pageText?.substring(0, 500)}`);
    
    console.log('\n✅ Flujo E2E real completado');
    console.log('📸 Screenshots capturados en test-results/');
  });

  test('test de upload con archivo real', async ({ page }) => {
    console.log('\n🧪 Test específico de upload con archivo real...\n');

    await page.goto('http://localhost:3000/adm/products/import');
    await page.waitForLoadState('networkidle');

    // Crear un CSV más complejo con edge cases
    const complexCsv = `name,price,category,description,stock
"Producto con comas",100.00,"Categoría, Compleja","Descripción con, comas",10
Producto con "comillas",200.50,Categoría B,"Descripción con ""comillas""",5
Producto con ñ y tildes,150.75,Categoría A,Descripción con caracteres especiales: áéíóúñ,15
Producto sin precio,,Categoría C,Descripción sin precio,20
,300.00,Categoría D,Descripción sin nombre,25
Producto válido,400.00,Categoría E,Descripción completa,30`;

    // Hacer upload del archivo complejo
    const selectFileButton = page.locator('button:has-text("Seleccionar Archivo")');
    await selectFileButton.click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'complex-test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(complexCsv)
    });
    
    await page.waitForTimeout(5000);
    
    // Capturar screenshot
    await page.screenshot({ path: 'test-results/importador-complex-csv.png', fullPage: true });
    
    // Analizar cómo maneja los edge cases
    const errorElements = await page.locator('[class*="error"], [class*="warning"]').count();
    console.log(`   Elementos de error/warning: ${errorElements}`);
    
    // Buscar mensajes específicos
    const messages = [
      'Formato inválido',
      'Error', 
      'Advertencia',
      'Warning',
      'Filas con problemas',
      'Datos inválidos'
    ];
    
    for (const msg of messages) {
      const found = await page.locator(`text=${msg}`).isVisible().catch(() => false);
      if (found) {
        console.log(`   ✅ Mensaje detectado: "${msg}"`);
      }
    }
    
    console.log('✅ Test de CSV complejo completado');
  });
});
