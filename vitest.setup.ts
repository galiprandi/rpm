import { config } from 'dotenv';
import { vi } from 'vitest';

// Load environment variables from .env.local, then .env as fallback
config({ path: '.env.local' });
config({ path: '.env' });

// Mock Next.js cache revalidation functions (not available in test env)
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("@/lib/cache", () => ({
  invalidateCashStatus: vi.fn(),
  getCachedCashStatus: vi.fn(),
  invalidateDashboard: vi.fn(),
  invalidatePriceLists: vi.fn(),
  invalidateVehicle: vi.fn(),
  invalidateCustomer: vi.fn(),
  vehicleCacheTag: (id: string) => `vehicle-${id}`,
  customerCacheTag: (id: string) => `customer-${id}`,
  CACHE_TAGS: {
    CASH_STATUS: 'cash-status',
    DASHBOARD: 'dashboard-data',
    PRICE_LISTS: 'price-lists',
  },
  CACHE_DURATIONS: {
    CASH_STATUS: 300,
    DASHBOARD: 60,
    PRICE_LISTS: 60,
    VEHICLE: 300,
    CUSTOMER: 300,
  },
}));

// Setup for Vitest tests
import '@testing-library/jest-dom/vitest';

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

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});
