import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for RPM Accesorios E2E Tests
 * 
 * Configuración para testing end-to-end de las rutas principales
 * según la especificación core.md
 */

export default defineConfig({
  testDir: './tests/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:3333',
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: process.env.CI ? 'only-on-failure' : 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'retain-on-failure',
  },

  // Configurar proyectos para diferentes navegadores
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Configurar servidor web para los tests
  webServer: {
    command: 'DEBUG_AUTH=true pnpm run start:debug',
    url: 'http://localhost:3333',
    reuseExistingServer: true,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'ignore',
  },
});
