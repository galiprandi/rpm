/**
 * Tests for lib/api-middleware.ts
 * Security-critical: validates auth wrappers and role hierarchy
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from './auth/roles';

// Mock next/headers before importing api-middleware
vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

// Mock auth before importing api-middleware
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(() => Promise.resolve(null)),
    },
  },
}));

// Mock dev-auth to control bypass behavior
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

vi.mock('@/lib/dev-auth', () => ({
  isDevBypassEnabled: mockIsDevBypassEnabled,
  createDevSession: mockCreateDevSession,
}));

// Import after mocks
const { withAuth, withRole, withAdmin, withStaff, withPublic } = await import('./api-middleware');

describe('api-middleware', () => {
  const createMockRequest = (url = 'http://localhost:3000/api/test') =>
    new NextRequest(url);

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDevBypassEnabled.mockReset();
    mockCreateDevSession.mockReset();
    mockIsDevBypassEnabled.mockReturnValue(false);
    mockCreateDevSession.mockReturnValue({
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
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('withAuth', () => {
    it('calls handler when dev bypass is enabled', async () => {
      mockIsDevBypassEnabled.mockReturnValue(true);

      const handler = vi.fn(async () => NextResponse.json({ ok: true }));
      const wrapped = withAuth(handler);
      const request = createMockRequest();

      const response = await wrapped(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('withRole', () => {
    it('returns 403 when role is insufficient', async () => {
      mockIsDevBypassEnabled.mockReturnValue(true);
      mockCreateDevSession.mockReturnValue({
        user: {
          id: 'dev-user',
          name: 'Developer',
          email: 'dev@localhost',
          image: null,
          role: UserRole.USER,
        },
        session: {
          id: 'dev-session',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userId: 'dev-user',
        },
      });

      const handler = vi.fn(async () => NextResponse.json({ ok: true }));
      const wrapped = withRole(UserRole.ADMIN, handler);
      const request = createMockRequest();

      const response = await wrapped(request);
      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error).toBe('Forbidden: Insufficient permissions');
      expect(handler).not.toHaveBeenCalled();
    });

    it('allows STAFF to access STAFF-protected endpoints', async () => {
      mockIsDevBypassEnabled.mockReturnValue(true);
      mockCreateDevSession.mockReturnValue({
        user: {
          id: 'staff-user',
          name: 'Staff User',
          email: 'staff@localhost',
          image: null,
          role: UserRole.STAFF,
        },
        session: {
          id: 'staff-session',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userId: 'staff-user',
        },
      });

      const handler = vi.fn(async () => NextResponse.json({ ok: true }));
      const wrapped = withRole(UserRole.STAFF, handler);
      const request = createMockRequest();

      const response = await wrapped(request);
      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('allows ADMIN to access STAFF-protected endpoints (hierarchy)', async () => {
      mockIsDevBypassEnabled.mockReturnValue(true);
      mockCreateDevSession.mockReturnValue({
        user: {
          id: 'admin-user',
          name: 'Admin User',
          email: 'admin@localhost',
          image: null,
          role: UserRole.ADMIN,
        },
        session: {
          id: 'admin-session',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userId: 'admin-user',
        },
      });

      const handler = vi.fn(async () => NextResponse.json({ ok: true }));
      const wrapped = withRole(UserRole.STAFF, handler);
      const request = createMockRequest();

      const response = await wrapped(request);
      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('withAdmin', () => {
    it('returns 403 for non-ADMIN roles', async () => {
      mockIsDevBypassEnabled.mockReturnValue(true);
      mockCreateDevSession.mockReturnValue({
        user: {
          id: 'user-1',
          name: 'User',
          email: 'user@localhost',
          image: null,
          role: UserRole.USER,
        },
        session: {
          id: 'user-session',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userId: 'user-1',
        },
      });

      const handler = vi.fn(async () => NextResponse.json({ ok: true }));
      const wrapped = withAdmin(handler);
      const request = createMockRequest();

      const response = await wrapped(request);
      expect(response.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });

    it('allows ADMIN access', async () => {
      mockIsDevBypassEnabled.mockReturnValue(true);

      const handler = vi.fn(async () => NextResponse.json({ ok: true }));
      const wrapped = withAdmin(handler);
      const request = createMockRequest();

      const response = await wrapped(request);
      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('withStaff', () => {
    it('returns 403 for USER role', async () => {
      mockIsDevBypassEnabled.mockReturnValue(true);
      mockCreateDevSession.mockReturnValue({
        user: {
          id: 'user-1',
          name: 'User',
          email: 'user@localhost',
          image: null,
          role: UserRole.USER,
        },
        session: {
          id: 'user-session',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userId: 'user-1',
        },
      });

      const handler = vi.fn(async () => NextResponse.json({ ok: true }));
      const wrapped = withStaff(handler);
      const request = createMockRequest();

      const response = await wrapped(request);
      expect(response.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('withPublic', () => {
    it('allows access without authentication', async () => {
      const handler = vi.fn(async () => NextResponse.json({ ok: true }));
      const wrapped = withPublic(handler);
      const request = createMockRequest();

      const response = await wrapped(request);
      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
