import { test, expect } from '@playwright/test';

/**
 * E2E Test suite para validación de rutas principales - Core Architecture
 * 
 * Especificaciones relacionadas:
 * - /specs/core.md - Arquitectura general y rutas
 * 
 * Alcance del test:
 * - Validación de rutas públicas y administrativas
 * - Verificación de estructura y contenido
 * - Testing de responsividad
 * 
 * Métricas cubiertas:
 * - Cobertura esperada: >90%
 * - Performance: <3s de carga
 */

test.describe('Core Routes Validation', () => {
  test.beforeEach(async () => {
    // Configurar timeout para cada test
    test.setTimeout(10000);
  });

  test('Página principal (/) - En desarrollo', async ({ page }) => {
    // Navegar a la página principal
    await page.goto('/');
    
    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle');
    
    // Validar título de la página
    await expect(page).toHaveTitle(/RPM Accesorios/);
    
    // Validar estructura principal
    const mainContainer = page.locator('body');
    await expect(mainContainer).toBeVisible();
    
    // Validar que exista el contenedor principal con estilo negro
    const blackContainer = page.locator('.bg-black');
    await expect(blackContainer).toBeVisible();
    await expect(blackContainer).toHaveClass(/text-white/);
    
    // Validar contenido principal
    const rpmTitle = page.locator('h1');
    await expect(rpmTitle).toContainText('RPM');
    await expect(rpmTitle).toContainText('Accesorios');
    
    // Validar mensaje "En desarrollo"
    const developmentMessage = page.locator('text=En desarrollo');
    await expect(developmentMessage).toBeVisible();
    
    // Validar descripción
    const description = page.locator('text=Estamos trabajando para traerte la mejor experiencia en accesorios');
    await expect(description).toBeVisible();
    
    // Validar indicador de estado
    const statusIndicator = page.locator('.animate-pulse');
    await expect(statusIndicator).toBeVisible();
    await expect(statusIndicator).toHaveClass(/bg-green-500/);
    
    // Validar mensaje "Próximamente disponible"
    const availableMessage = page.locator('text=Próximamente disponible');
    await expect(availableMessage).toBeVisible();
    
    // Validar diseño mobile-first - verificar clases responsivas
    const titleElement = page.locator('h1');
    await expect(titleElement).toHaveClass(/text-4xl/); // Base
    await expect(titleElement).toHaveClass(/md:text-6xl/); // Desktop
    
    const subtitleElement = page.locator('h1 span');
    await expect(subtitleElement).toHaveClass(/text-2xl/); // Base
    await expect(subtitleElement).toHaveClass(/md:text-3xl/); // Desktop
  });

  test('Página de administración (/adm) - Dashboard', async ({ page }) => {
    // Navegar a la página de administración
    await page.goto('/adm');
    
    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle');
    
    // Validar título de la página
    await expect(page).toHaveTitle(/RPM Accesorios/);
    
    // Validar estructura del layout administrativo
    const adminLayout = page.locator('.min-h-screen.bg-background');
    await expect(adminLayout).toBeVisible();
    
    // Validar sidebar
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveClass(/bg-card/);
    await expect(sidebar).toHaveClass(/border-r/);
    
    // Validar título del sidebar (expandido por defecto)
    const sidebarTitle = sidebar.locator('h2');
    await expect(sidebarTitle).toContainText('RPM Admin');
    await expect(sidebarTitle).toHaveClass(/text-lg/);
    await expect(sidebarTitle).toHaveClass(/font-semibold/);
    
    // Validar botón de colapsar
    const collapseButton = sidebar.locator('button[aria-label="Collapse sidebar"]');
    await expect(collapseButton).toBeVisible();
    
    // Validar contenido principal
    const main = page.locator('main');
    await expect(main).toBeVisible();
    await expect(main).toHaveClass(/p-6/);
    
    // Validar título del dashboard
    const dashboardTitle = main.locator('h2');
    await expect(dashboardTitle).toContainText('Dashboard');
    await expect(dashboardTitle).toHaveClass(/text-2xl/);
    await expect(dashboardTitle).toHaveClass(/font-bold/);
  });

  test('Página de login (/login) - Autenticación', async ({ page }) => {
    // Navegar a la página de login
    await page.goto('/login');
    
    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle');
    
    // Validar título de la página
    await expect(page).toHaveTitle(/RPM Accesorios/);
    
    // Validar estructura de login
    const loginContainer = page.locator('.min-h-screen');
    await expect(loginContainer).toBeVisible();
    await expect(loginContainer).toHaveClass(/bg-background/);
    await expect(loginContainer).toHaveClass(/flex/);
    await expect(loginContainer).toHaveClass(/items-center/);
    await expect(loginContainer).toHaveClass(/justify-center/);
    
    // Validar card de login
    const loginCard = page.locator('.bg-card.rounded-lg.border.p-6');
    await expect(loginCard).toBeVisible();
    
    // Validar título de login
    const loginTitle = page.locator('h2');
    await expect(loginTitle).toContainText('RPM Admin');
    await expect(loginTitle).toHaveClass(/text-3xl/);
    await expect(loginTitle).toHaveClass(/font-bold/);
    
    // Validar subtítulo
    const loginSubtitle = page.locator('text=Inicia sesión para acceder al panel de administración');
    await expect(loginSubtitle).toBeVisible();
    await expect(loginSubtitle).toHaveClass(/text-muted-foreground/);
    
    // Validar mensaje de proximidad
    const proximityMessage = page.locator('text=El sistema de autenticación estará disponible próximamente');
    await expect(proximityMessage).toBeVisible();
    
    // Validar mensaje de implementación
    const implementationMessage = page.locator('text=Se implementará con Google OAuth según la especificación');
    await expect(implementationMessage).toBeVisible();
    
    // Validar footer
    const footer = page.locator('text=Área de administración - RPM Accesorios');
    await expect(footer).toBeVisible();
    await expect(footer).toHaveClass(/text-xs/);
    await expect(footer).toHaveClass(/text-muted-foreground/);
  });

  test('Validación de rutas inexistentes - 404', async ({ page }) => {
    // Probar ruta inexistente
    await page.goto('/ruta-inexistente');
    
    // Validar que muestre página 404
    const notFoundContent = page.locator('text=404');
    await expect(notFoundContent).toBeVisible();
    
    const notFoundMessage = page.locator('text=This page could not be found');
    await expect(notFoundMessage).toBeVisible();
  });

  test('Performance de carga de rutas principales', async ({ page }) => {
    // Medir performance de la página principal
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Validar que cargue en menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
    
    // Medir performance del dashboard
    const adminStartTime = Date.now();
    await page.goto('/adm');
    await page.waitForLoadState('networkidle');
    const adminLoadTime = Date.now() - adminStartTime;
    
    // Validar que cargue en menos de 3 segundos
    expect(adminLoadTime).toBeLessThan(3000);
    
    // Medir performance del login
    const loginStartTime = Date.now();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const loginLoadTime = Date.now() - loginStartTime;
    
    // Validar que cargue en menos de 3 segundos
    expect(loginLoadTime).toBeLessThan(3000);
  });

  test('Validación de responsividad en móvil', async ({ page }) => {
    // Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Probar página principal en móvil
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Validar que el contenido sea visible en móvil
    const rpmTitle = page.locator('h1');
    await expect(rpmTitle).toBeVisible();
    
    // Probar dashboard en móvil
    await page.goto('/adm');
    await page.waitForLoadState('networkidle');
    
    // Validar que el sidebar sea visible en móvil (desktop-first)
    const sidebar = page.locator('.w-64');
    await expect(sidebar).toBeVisible();
    
    // Validar título simple en móvil
    const dashboardTitle = page.locator('main h2');
    await expect(dashboardTitle).toContainText('Dashboard');
  });

  test('Validación de accesibilidad básica', async ({ page }) => {
    // Probar página principal
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Validar estructura semántica
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Validar contraste de colores (básico)
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Validar que exista contenedor oscuro
    const darkContainer = page.locator('.bg-black');
    await expect(darkContainer).toBeVisible();
    await expect(darkContainer).toHaveClass(/text-white/);
    
    // Probar dashboard
    await page.goto('/adm');
    await page.waitForLoadState('networkidle');
    
    // Validar estructura semántica del dashboard
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
