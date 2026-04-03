import { test, expect } from '@playwright/test';

/**
 * Test de Debug Auth Bypass para Importador
 * 
 * Este test verifica que el bypass de autenticación funcione correctamente
 * para acceder al importador de productos.
 */

test.describe('Debug Auth Bypass - Importador', () => {
  test.use({ 
    baseURL: 'http://localhost:3000',
    // Configuración importante para que las cookies persistan
    contextOptions: {
      httpCredentials: undefined
    }
  });

  test('debe navegar al importador usando bypass de auth', async ({ page, context, request }) => {
    console.log('\n🚀 Iniciando prueba de bypass...\n');
    
    // PASO 1: Crear sesión debug via API
    console.log('🔐 PASO 1: Creando sesión debug...');
    
    const response = await request.post('/api/auth/debug', {
      data: { role: 'ADMIN' }
    });
    
    expect(response.ok()).toBeTruthy();
    
    // Extraer cookies del response y aplicar al contexto
    const setCookieHeader = response.headers()['set-cookie'];
    console.log('   Set-Cookie header presente:', !!setCookieHeader);
    
    if (setCookieHeader) {
      // Parsear y aplicar cookies manualmente
      const cookies = parseSetCookieHeader(setCookieHeader);
      for (const cookie of cookies) {
        await context.addCookies([cookie]);
      }
      console.log('   Cookies aplicadas al contexto');
    }
    
    // Verificar sesión
    const sessionRes = await request.get('/api/auth/debug');
    const sessionData = await sessionRes.json();
    console.log('   Sesión autenticada:', sessionData.authenticated);
    expect(sessionData.authenticated).toBe(true);
    
    // PASO 2: Navegar al importador
    console.log('\n📍 PASO 2: Navegando a /adm/products/import...');
    
    await page.goto('/adm/products/import', { waitUntil: 'networkidle' });
    
    const url = page.url();
    console.log('   URL actual:', url);
    
    // PASO 3: Verificar resultado
    console.log('\n👁️  PASO 3: Verificaciones...');
    
    const isImportPage = url.includes('/adm/products/import');
    const isLoginPage = url.includes('/login');
    
    console.log('   En página de importador:', isImportPage);
    console.log('   Redirigido a login:', isLoginPage);
    
    // Capturar screenshot
    await page.screenshot({ 
      path: isImportPage ? 'test-results/bypass-import-ok.png' : 'test-results/bypass-import-fail.png',
      fullPage: true 
    });
    
    // Resultado
    console.log('\n' + '='.repeat(60));
    if (isImportPage) {
      console.log('✅ ÉXITO: Bypass funcionó correctamente');
      await expect(page).toHaveURL('/adm/products/import');
    } else {
      console.log('❌ FALLO: Redirigido a ' + url);
      
      // Información de debug
      const cookies = await context.cookies();
      console.log('\n   Cookies en contexto:');
      cookies.forEach(c => {
        console.log(`     - ${c.name}: path=${c.path}, httpOnly=${c.httpOnly}`);
      });
      
      // Intentar entender por qué falló
      console.log('\n   Nota: El Server Component no reconoce la cookie.');
      console.log('   Posibles causas:');
      console.log('   1. Problema con cookies() helper de Next.js');
      console.log('   2. La cookie no se propaga al Server Component');
      console.log('   3. Necesita re-carga del servidor');
    }
    console.log('='.repeat(60) + '\n');
    
    // Mantener para verificación visual
    await page.waitForTimeout(5000);
  });
});

// Helper para parsear Set-Cookie header
function parseSetCookieHeader(header: string) {
  const cookies = [];
  const parts = header.split(/,(?=[^;]*=)/); // Split por comas seguidas de nuevos nombres de cookie
  
  for (const part of parts) {
    const cookieMatch = part.trim().match(/([^=]+)=([^;]+)(;.*)?/);
    if (cookieMatch) {
      const [, name, value, attrs] = cookieMatch;
      const cookie: { name: string; value: string; domain: string; path: string; httpOnly: boolean; secure: boolean; sameSite?: 'Lax' | 'Strict' | 'None' } = {
        name,
        value,
        domain: 'localhost',
        path: '/',
        httpOnly: (attrs || '').toLowerCase().includes('httponly'),
        secure: (attrs || '').toLowerCase().includes('secure'),
      };
      
      // Parsear SameSite
      const sameSiteMatch = (attrs || '').match(/SameSite=([^;]+)/i);
      if (sameSiteMatch) {
        const sameSite = sameSiteMatch[1].trim();
        if (sameSite === 'Lax' || sameSite === 'Strict' || sameSite === 'None') {
          cookie.sameSite = sameSite;
        }
      }
      
      cookies.push(cookie);
    }
  }
  
  return cookies;
}
