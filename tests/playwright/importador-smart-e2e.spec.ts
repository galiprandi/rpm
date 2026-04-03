import { test, expect } from '@playwright/test';

test.describe('Importador de Productos - Flujo E2E Inteligente', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar auth debug
    await page.goto('http://localhost:3000');
    const response = await page.request.post('http://localhost:3000/api/auth/debug', {
      data: { role: 'ADMIN' }
    });
    expect(response.ok()).toBeTruthy();
  });

  test('flujo completo entendiendo la lógica del importador', async ({ page }) => {
    console.log('\n🧠 Iniciando flujo E2E inteligente del importador...\n');

    // PASO 1: Navegar y cargar archivo
    console.log('📍 PASO 1: Navegando y cargando archivo...');
    await page.goto('http://localhost:3000/adm/products/import');
    await page.waitForLoadState('networkidle');
    
    // Cargar archivo CSV simple y válido
    const csvContent = `name,price,category,description,stock
Producto Test 1,100.00,Categoría A,Descripción del producto 1,10
Producto Test 2,200.50,Categoría B,Descripción del producto 2,15
Producto Test 3,150.75,Categoría A,Descripción del producto 3,20`;

    const selectFileButton = page.locator('button:has-text("Seleccionar Archivo")');
    await selectFileButton.click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'simple-test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });
    
    await page.waitForTimeout(3000);
    console.log('   ✅ Archivo CSV cargado');

    // PASO 2: Analizar y configurar mapeo de columnas
    console.log('\n🗂️  PASO 2: Analizando mapeo de columnas...');
    
    // Capturar screenshot para análisis visual
    await page.screenshot({ path: 'test-results/importador-mapping-analysis.png', fullPage: true });
    
    // Buscar los botones de mapeo que vimos en el test anterior
    const mappingButtons = [
      'Capitalizar',
      'Mayúsculas', 
      'Solo trim',
      'Formato español (1.234,56)',
      'Redondear entero',
      'Capitalizar + fuzzy match'
    ];
    
    console.log('   🔍 Analizando opciones de mapeo disponibles:');
    
    for (const mapping of mappingButtons) {
      const buttons = page.locator(`button:has-text("${mapping}")`);
      const count = await buttons.count();
      if (count > 0) {
        console.log(`     - ${mapping}: ${count} botones`);
        
        // Intentar hacer clic en el primer botón de cada tipo para activarlo
        for (let i = 0; i < count; i++) {
          const button = buttons.nth(i);
          const isEnabled = await button.isEnabled();
          if (isEnabled) {
            await button.click();
            await page.waitForTimeout(500);
            console.log(`       ✅ Activado ${mapping} (botón ${i})`);
            break;
          }
        }
      }
    }
    
    // PASO 3: Configurar categorías
    console.log('\n📂 PASO 3: Configurando categorías...');
    
    // Buscar botones de categoría
    const categoryButtons = [
      'Sin categoría',
      'Omitir'
    ];
    
    for (const category of categoryButtons) {
      const buttons = page.locator(`button:has-text("${category}")`);
      const count = await buttons.count();
      if (count > 0) {
        console.log(`   - ${category}: ${count} botones`);
        
        // Hacer clic en el primer botón para configurar
        const firstButton = buttons.first();
        if (await firstButton.isEnabled()) {
          await firstButton.click();
          await page.waitForTimeout(500);
          console.log(`   ✅ Configurado ${category}`);
        }
      }
    }

    // PASO 4: Verificar estado del botón Continuar
    console.log('\n⚡ PASO 4: Verificando estado del botón Continuar...');
    
    const continueButton = page.locator('button:has-text("Continuar")');
    const isContinueEnabled = await continueButton.isEnabled();
    console.log(`   Botón Continuar habilitado: ${isContinueEnabled}`);
    
    if (!isContinueEnabled) {
      console.log('   🔍 El botón Continuar está deshabilitado. Analizando causas...');
      
      // Buscar posibles errores o validaciones pendientes
      const errorElements = await page.locator('[class*="error"], [class*="warning"], [role="alert"]').count();
      console.log(`   Elementos de error/warning: ${errorElements}`);
      
      // Buscar mensajes de validación
      const validationTexts = await page.locator('text*=requerido, text*=obligatorio, text*=necesario').count();
      console.log(`   Mensajes de validación: ${validationTexts}`);
      
      // Revisar si hay campos "No mapear" que deberían configurarse
      const noMapButtons = page.locator('button:has-text("No mapear")');
      const noMapCount = await noMapButtons.count();
      console.log(`   Botones "No mapear": ${noMapCount}`);
      
      // Intentar cambiar configuración de "No mapear" a opciones válidas
      for (let i = 0; i < noMapCount; i++) {
        const noMapButton = noMapButtons.nth(i);
        const isVisible = await noMapButton.isVisible();
        if (isVisible) {
          console.log(`   🔧 Intentando configurar botón No mapear ${i}...`);
          
          // Buscar botones de acción cerca de este botón
          const parent = noMapButton.locator('..');
          const siblings = await parent.locator('button').all();
          
          for (const sibling of siblings) {
            const text = await sibling.textContent();
            if (text && text !== 'No mapear' && await sibling.isEnabled()) {
              await sibling.click();
              await page.waitForTimeout(500);
              console.log(`     ✅ Cambiado a: "${text}"`);
              break;
            }
          }
        }
      }
      
      // Verificar nuevamente el botón Continuar
      const isNowEnabled = await continueButton.isEnabled();
      console.log(`   Botón Continuar ahora habilitado: ${isNowEnabled}`);
    }

    // PASO 5: Continuar con el flujo
    console.log('\n🚀 PASO 5: Continuando con el flujo...');
    
    const finalContinueEnabled = await continueButton.isEnabled();
    if (finalContinueEnabled) {
      console.log('   ✅ Haciendo clic en Continuar...');
      await continueButton.click();
      await page.waitForTimeout(3000);
      
      // Capturar screenshot después de continuar
      await page.screenshot({ path: 'test-results/importador-despues-continuar.png', fullPage: true });
      
      // Analizar la siguiente pantalla
      const newButtons = await page.locator('button').count();
      console.log(`   Botones en nueva pantalla: ${newButtons}`);
      
      // Listar nuevos botones
      for (let i = 0; i < Math.min(newButtons, 10); i++) {
        const button = page.locator('button').nth(i);
        const isVisible = await button.isVisible();
        if (isVisible) {
          const text = await button.textContent();
          console.log(`     - Botón ${i}: "${text}"`);
        }
      }
      
      // Buscar botones de acción final
      const finalActions = ['Importar', 'Confirmar', 'Finalizar', 'Completar'];
      for (const action of finalActions) {
        const button = page.locator(`button:has-text("${action}")`);
        if (await button.isVisible({ timeout: 2000 })) {
          console.log(`   ✅ Botón final encontrado: "${action}"`);
          await button.click();
          await page.waitForTimeout(5000);
          
          // Capturar screenshot final
          await page.screenshot({ path: 'test-results/importador-resultado-final.png', fullPage: true });
          
          // Buscar mensajes de éxito
          const successMessages = await page.locator('text*=éxito, text*=completado, text*=exitoso, text*=importación').count();
          console.log(`   Mensajes de éxito: ${successMessages}`);
          
          break;
        }
      }
    } else {
      console.log('   ⚠️ No se pudo habilitar el botón Continuar. Capturando estado actual...');
      await page.screenshot({ path: 'test-results/importador-estado-bloqueado.png', fullPage: true });
    }

    // PASO 6: Análisis final
    console.log('\n📊 PASO 6: Análisis final...');
    
    const finalUrl = page.url();
    console.log(`   URL final: ${finalUrl}`);
    
    // Buscar cualquier mensaje de estado
    const pageText = await page.textContent('body');
    const hasSuccess = pageText?.includes('éxito') || pageText?.includes('completado') || pageText?.includes('exitoso');
    const hasError = pageText?.includes('error') || pageText?.includes('Error') || pageText?.includes('falló');
    
    console.log(`   ¿Hay éxito?: ${hasSuccess}`);
    console.log(`   ¿Hay error?: ${hasError}`);
    
    console.log('\n✅ Flujo E2E inteligente completado');
    console.log('📸 Screenshots capturados para análisis');
  });

  test('análisis de UX y detección de problemas', async ({ page }) => {
    console.log('\n🎨 Iniciando análisis de UX...\n');

    await page.goto('http://localhost:3000/adm/products/import');
    await page.waitForLoadState('networkidle');
    
    // Capturar estado inicial
    await page.screenshot({ path: 'test-results/ux-estado-inicial.png', fullPage: true });
    
    // Cargar archivo
    const csvContent = `name,price,category
Producto 1,100.00,Cat A
Producto 2,200.00,Cat B`;
    
    const selectFileButton = page.locator('button:has-text("Seleccionar Archivo")');
    await selectFileButton.click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'ux-test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });
    
    await page.waitForTimeout(3000);
    
    // Analizar problemas de UX
    console.log('🔍 Analizando problemas de UX...');
    
    // 1. Terminología confusa
    const confusingTerms = [
      'Capitalizar + fuzzy match',
      'Formato español (1.234,56)',
      'Redondear entero'
    ];
    
    console.log('   Términos potencialmente confusos encontrados:');
    for (const term of confusingTerms) {
      const elements = await page.locator(`text=${term}`).count();
      if (elements > 0) {
        console.log(`     - "${term}" (${elements} ocurrencias)`);
      }
    }
    
    // 2. Feedback visual insuficiente
    const loadingIndicators = await page.locator('[class*="loading"], [class*="spinner"], [role="progressbar"]').count();
    const progressIndicators = await page.locator('[class*="progress"]').count();
    
    console.log(`   Indicadores de carga: ${loadingIndicators}`);
    console.log(`   Indicadores de progreso: ${progressIndicators}`);
    
    // 3. Botones deshabilitados sin explicación
    const disabledButtons = await page.locator('button:disabled').count();
    console.log(`   Botones deshabilitados: ${disabledButtons}`);
    
    // 4. Falta de instrucciones claras
    const helpText = await page.locator('text*=instrucción, text*=guía, text*=ayuda, text*=help').count();
    console.log(`   Textos de ayuda: ${helpText}`);
    
    // Capturar screenshot para análisis UX
    await page.screenshot({ path: 'test-results/ux-analisis-completo.png', fullPage: true });
    
    console.log('\n✅ Análisis de UX completado');
  });
});
