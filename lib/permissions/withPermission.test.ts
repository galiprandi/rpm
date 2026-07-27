/**
 * Tests for withPermission middleware in lib/api-middleware.ts
 * Validates permission-based access control: ADMIN bypass, permission checks,
 * 403 on missing permission, 401 on unauthenticated.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/lib/auth/roles';

// Use vi.hoisted for mock variables referenced inside hoisted vi.mock factories
const mocks = vi.hoisted(() => {
  const mockGetSession = vi.fn(() => Promise.resolve(null));
  const mockIsDevBypassEnabled = vi.fn(() => false);
  const mockCreateDevSession = vi.fn(() => ({
    user: {
      id: 'dev-user',
      name: 'Developer',
      email: 'dev@localhost',
      image: null,
      role: UserRole.ADMIN,
    },
    session: {
      id: 'dev-session',
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userId: 'dev-user',
    },
  }));
  const mockHasPermission = vi.fn((session: unknown, perm: string) => {
    const s = session as { user?: { role?: string; permissions?: string[] } };
    if (s?.user?.role === 'ADMIN') return true;
    return s?.user?.permissions?.includes(perm) ?? false;
  });
  const mockLoadPermissionsForRole = vi.fn<(role: string) => Promise<string[]>>(() => Promise.resolve([]));
  return {
    mockGetSession,
    mockIsDevBypassEnabled,
    mockCreateDevSession,
    mockHasPermission,
    mockLoadPermissionsForRole,
  };
});

// Mock next/headers — use a plain object to avoid `new Headers()` issues in jsdom
vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve({} as Headers)),
}));

// Mock auth — getSession returns null by default (unauthenticated)
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mocks.mockGetSession,
    },
  },
}));

// Mock dev-auth to control bypass behavior
vi.mock('@/lib/dev-auth', () => ({
  isDevBypassEnabled: mocks.mockIsDevBypassEnabled,
  createDevSession: mocks.mockCreateDevSession,
}));

// Mock the permission check module
vi.mock('@/lib/permissions/check', () => ({
  hasPermission: mocks.mockHasPermission,
  loadPermissionsForRole: mocks.mockLoadPermissionsForRole,
}));

// Import after mocks
const { withPermission } = await import('@/lib/api-middleware');

describe('withPermission middleware', () => {
  const createMockRequest = (url = 'http://localhost:3000/api/test') =>
    new NextRequest(url);

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockIsDevBypassEnabled.mockReturnValue(false);
    mocks.mockGetSession.mockResolvedValue(null);
    // Reset hasPermission to default behavior
    mocks.mockHasPermission.mockImplementation((session: unknown, perm: string) => {
      const s = session as { user?: { role?: string; permissions?: string[] } };
      if (s?.user?.role === 'ADMIN') return true;
      return s?.user?.permissions?.includes(perm) ?? false;
    });
    // Reset loadPermissionsForRole to default (empty)
    mocks.mockLoadPermissionsForRole.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('calls handler when user has the permission (returns 200)', async () => {
    mocks.mockIsDevBypassEnabled.mockReturnValue(true);
    mocks.mockCreateDevSession.mockReturnValue({
      user: {
        id: 'vendedor-1',
        name: 'Vendedor',
        email: 'vendedor@test.com',
        image: null,
        role: UserRole.VENDEDOR,
      },
      session: {
        id: 'session-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: 'vendedor-1',
      },
    });
    // getSessionWithAuth calls loadPermissionsForRole and overwrites permissions,
    // so we must return the expected permissions from the mock
    mocks.mockLoadPermissionsForRole.mockResolvedValue(['can_edit_products']);

    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const wrapped = withPermission('can_edit_products', handler);
    const request = createMockRequest();

    const response = await wrapped(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(mocks.mockHasPermission).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.any(Object) }),
      'can_edit_products',
    );
  });

  it('returns 403 when user does NOT have the permission', async () => {
    mocks.mockIsDevBypassEnabled.mockReturnValue(true);
    mocks.mockCreateDevSession.mockReturnValue({
      user: {
        id: 'vendedor-1',
        name: 'Vendedor',
        email: 'vendedor@test.com',
        image: null,
        role: UserRole.VENDEDOR,
      },
      session: {
        id: 'session-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: 'vendedor-1',
      },
    });
    // VENDEDOR only has can_edit_products, NOT can_edit_costs
    mocks.mockLoadPermissionsForRole.mockResolvedValue(['can_edit_products']);

    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const wrapped = withPermission('can_edit_costs', handler);
    const request = createMockRequest();

    const response = await wrapped(request);
    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error).toBe('Forbidden: Insufficient permissions');
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns 401 when not authenticated', async () => {
    // Dev bypass disabled, no session from Better Auth
    mocks.mockIsDevBypassEnabled.mockReturnValue(false);
    mocks.mockGetSession.mockResolvedValue(null);

    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const wrapped = withPermission('can_edit_products', handler);
    const request = createMockRequest();

    const response = await wrapped(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
    expect(handler).not.toHaveBeenCalled();
  });

  it('ADMIN always passes regardless of permission', async () => {
    mocks.mockIsDevBypassEnabled.mockReturnValue(true);
    mocks.mockCreateDevSession.mockReturnValue({
      user: {
        id: 'admin-1',
        name: 'Admin',
        email: 'admin@test.com',
        image: null,
        role: UserRole.ADMIN,
      },
      session: {
        id: 'admin-session',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: 'admin-1',
      },
    });
    // ADMIN gets ['*'] from loadPermissionsForRole
    mocks.mockLoadPermissionsForRole.mockResolvedValue(['*']);

    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    // Request a permission ADMIN doesn't explicitly have in its array
    const wrapped = withPermission('can_manage_users', handler);
    const request = createMockRequest();

    const response = await wrapped(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
