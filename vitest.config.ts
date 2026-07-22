import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

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
      // Database integration tests - use `pnpm test:db` or `pnpm test:all`
      '**/lib/services/*Service.test.ts',
      '**/tests/db.test.ts',
      '**/tests/regression/**',
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
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
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
