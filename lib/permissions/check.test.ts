/**
 * Tests for lib/permissions/check.ts
 * Validates hasPermission, loadPermissionsForRole, and savePermissionsForRole.
 * DB is mocked to avoid real database connections.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so mock variables are available inside hoisted vi.mock factories
const mocks = vi.hoisted(() => {
  const mockFindMany = vi.fn();
  const mockDeleteWhere = vi.fn();
  const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));
  const mockInsertValues = vi.fn();
  const mockInsert = vi.fn(() => ({ values: mockInsertValues }));
  return { mockFindMany, mockDeleteWhere, mockDelete, mockInsertValues, mockInsert };
});

// Mock the DB module
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      rolePermission: {
        findMany: mocks.mockFindMany,
      },
    },
    delete: mocks.mockDelete,
    insert: mocks.mockInsert,
  },
}));

// Mock the schema module — check.ts imports rolePermission from it
vi.mock('@/db/schema', () => ({
  rolePermission: {
    role: 'role',
    permission: 'permission',
    enabled: 'enabled',
  },
}));

// Mock drizzle-orm operators used in check.ts and roles.ts
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val, op: 'eq' })),
  and: vi.fn((...args: unknown[]) => ({ op: 'and', args })),
  inArray: vi.fn((col: unknown, val: unknown) => ({ col, val, op: 'inArray' })),
}));

// Import after mocks are set up
import {
  hasPermission,
  loadPermissionsForRole,
  savePermissionsForRole,
} from './check';
import { DEFAULT_PERMISSIONS } from './catalog';

describe('Permission Check Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasPermission', () => {
    it('returns true when role is ADMIN regardless of permissions array', () => {
      const session = {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
          permissions: [],
        },
      };
      expect(hasPermission(session, 'can_edit_products')).toBe(true);
    });

    it('returns true when role is ADMIN even with no permissions property', () => {
      const session = {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
        },
      };
      expect(hasPermission(session, 'can_manage_users')).toBe(true);
    });

    it('returns true when permissions array includes the permission', () => {
      const session = {
        user: {
          id: 'vendedor-1',
          role: 'VENDEDOR',
          permissions: ['can_edit_products', 'can_manage_cash'],
        },
      };
      expect(hasPermission(session, 'can_edit_products')).toBe(true);
    });

    it('returns false when permissions array does NOT include the permission', () => {
      const session = {
        user: {
          id: 'vendedor-1',
          role: 'VENDEDOR',
          permissions: ['can_edit_products'],
        },
      };
      expect(hasPermission(session, 'can_edit_costs')).toBe(false);
    });

    it('returns false when session is null', () => {
      expect(hasPermission(null, 'can_edit_products')).toBe(false);
    });

    it('returns false when session is undefined', () => {
      expect(hasPermission(undefined, 'can_edit_products')).toBe(false);
    });

    it('returns false when session.user has no permissions array', () => {
      const session = {
        user: {
          id: 'vendedor-1',
          role: 'VENDEDOR',
        },
      };
      expect(hasPermission(session, 'can_edit_products')).toBe(false);
    });

    it("returns false when permissions is ['*'] but permission is not '*' (no wildcard expansion in hasPermission)", () => {
      // hasPermission does NOT expand '*' wildcards — that logic is in UserProvider.can().
      // Only ADMIN gets short-circuited to true. Non-ADMIN with ['*'] still uses includes().
      const session = {
        user: {
          id: 'vendedor-1',
          role: 'VENDEDOR',
          permissions: ['*'],
        },
      };
      expect(hasPermission(session, 'can_edit_products')).toBe(false);
      // However, checking for '*' itself does match
      expect(hasPermission(session, '*')).toBe(true);
    });
  });

  describe('loadPermissionsForRole', () => {
    it("returns ['*'] for ADMIN", async () => {
      const result = await loadPermissionsForRole('ADMIN');
      expect(result).toEqual(['*']);
      expect(mocks.mockFindMany).not.toHaveBeenCalled();
    });

    it('returns [] for USER (non-configurable role)', async () => {
      const result = await loadPermissionsForRole('USER');
      expect(result).toEqual([]);
      expect(mocks.mockFindMany).not.toHaveBeenCalled();
    });

    it('returns DB permissions for VENDEDOR when DB has rows', async () => {
      mocks.mockFindMany.mockResolvedValue([
        { permission: 'can_edit_products', enabled: true, role: 'VENDEDOR' },
        { permission: 'can_manage_cash', enabled: true, role: 'VENDEDOR' },
      ]);

      const result = await loadPermissionsForRole('VENDEDOR');
      expect(result).toEqual(['can_edit_products', 'can_manage_cash']);
      expect(mocks.mockFindMany).toHaveBeenCalledTimes(1);
    });

    it('returns DEFAULT_PERMISSIONS.VENDEDOR when DB has no rows (empty)', async () => {
      mocks.mockFindMany.mockResolvedValue([]);

      const result = await loadPermissionsForRole('VENDEDOR');
      expect(result).toEqual(DEFAULT_PERMISSIONS.VENDEDOR);
      expect(result).toHaveLength(8);
    });

    it('returns DEFAULT_PERMISSIONS.STAFF (empty) for STAFF when DB has no rows', async () => {
      mocks.mockFindMany.mockResolvedValue([]);

      const result = await loadPermissionsForRole('STAFF');
      expect(result).toEqual([]);
      expect(result).toEqual(DEFAULT_PERMISSIONS.STAFF);
    });

    it('handles lowercase role input (normalizes to uppercase)', async () => {
      mocks.mockFindMany.mockResolvedValue([
        { permission: 'can_edit_products', enabled: true, role: 'VENDEDOR' },
      ]);

      const result = await loadPermissionsForRole('vendedor');
      expect(result).toEqual(['can_edit_products']);
    });
  });

  describe('savePermissionsForRole', () => {
    it('throws when role is ADMIN (not configurable)', async () => {
      await expect(savePermissionsForRole('ADMIN', ['can_edit_products'])).rejects.toThrow(
        /not configurable/i,
      );
      expect(mocks.mockDelete).not.toHaveBeenCalled();
      expect(mocks.mockInsert).not.toHaveBeenCalled();
    });

    it('throws when role is USER (not configurable)', async () => {
      await expect(savePermissionsForRole('USER', ['can_edit_products'])).rejects.toThrow(
        /not configurable/i,
      );
      expect(mocks.mockDelete).not.toHaveBeenCalled();
      expect(mocks.mockInsert).not.toHaveBeenCalled();
    });

    it('throws when a permission is invalid (not in catalog)', async () => {
      await expect(
        savePermissionsForRole('VENDEDOR', ['invalid_perm']),
      ).rejects.toThrow(/Invalid permission: invalid_perm/i);
      expect(mocks.mockDelete).not.toHaveBeenCalled();
    });

    it('calls db.delete and db.insert for valid role + permissions', async () => {
      const perms = ['can_edit_products', 'can_manage_cash'];

      await savePermissionsForRole('VENDEDOR', perms);

      expect(mocks.mockDelete).toHaveBeenCalledTimes(1);
      expect(mocks.mockDeleteWhere).toHaveBeenCalledTimes(1);
      expect(mocks.mockInsert).toHaveBeenCalledTimes(1);
      expect(mocks.mockInsertValues).toHaveBeenCalledTimes(1);
    });

    it('calls db.delete but NOT db.insert when permissions list is empty', async () => {
      await savePermissionsForRole('STAFF', []);

      expect(mocks.mockDelete).toHaveBeenCalledTimes(1);
      expect(mocks.mockDeleteWhere).toHaveBeenCalledTimes(1);
      expect(mocks.mockInsert).not.toHaveBeenCalled();
    });
  });
});
