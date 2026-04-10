import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

// Config for running ALL tests including DB integration tests
// Usage: pnpm test:all (requires database to be running)

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/tests/playwright/**',
      '**/tests/e2e/**',
      '**/test-results/**',
      '**/playwright-report/**',
      '**/.next/**',
      '**/storybook-static/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        '.vercel/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/tests/playwright/**',
        '**/test-results/**',
        '**/playwright-report/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
  define: {
    'process.env.NODE_ENV': '"test"',
  },
});
