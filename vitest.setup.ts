import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Setup for Vitest tests
import '@testing-library/jest-dom';

// Mock Next.js headers
const mockHeaders = new Headers();
Object.defineProperty(global, 'Headers', {
  value: () => mockHeaders,
});

// Mock NextResponse
const mockNextResponse = {
  json: (data: unknown, init?: ResponseInit) => ({
    status: init?.status || 200,
    json: async () => data,
  }),
};

Object.defineProperty(global, 'NextResponse', {
  value: mockNextResponse,
});

// Mock process.uptime
Object.defineProperty(process, 'uptime', {
  value: () => 123.456,
});

// Mock process.memoryUsage
Object.defineProperty(process, 'memoryUsage', {
  value: () => ({
    heapUsed: 1024 * 1024 * 50, // 50MB
    heapTotal: 1024 * 1024 * 100, // 100MB
  }),
});
