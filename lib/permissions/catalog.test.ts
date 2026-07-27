/**
 * Tests for lib/permissions/catalog.ts
 * Validates the permission catalog: IDs, categories, configurable roles, and defaults.
 */
import { describe, it, expect } from 'vitest';
import {
  ALL_PERMISSION_IDS,
  isValidPermission,
  PERMISSION_CATALOG,
  CONFIGURABLE_ROLES,
  DEFAULT_PERMISSIONS,
} from './catalog';

describe('Permission Catalog', () => {
  describe('ALL_PERMISSION_IDS', () => {
    it('contains all 15 permission IDs', () => {
      expect(ALL_PERMISSION_IDS).toHaveLength(15);
    });

    it('includes expected permission IDs', () => {
      const expectedIds = [
        'can_edit_products',
        'can_edit_costs',
        'can_edit_stock',
        'can_manage_categories',
        'can_manage_services',
        'can_manage_suppliers',
        'can_manage_customers',
        'can_create_sales',
        'can_create_credit_notes',
        'can_cancel_credit_notes',
        'can_manage_cash',
        'can_approve_inventory',
        'can_manage_users',
        'can_manage_settings',
        'can_run_maintenance',
      ];
      for (const id of expectedIds) {
        expect(ALL_PERMISSION_IDS).toContain(id);
      }
    });
  });

  describe('isValidPermission', () => {
    it("returns true for 'can_edit_products'", () => {
      expect(isValidPermission('can_edit_products')).toBe(true);
    });

    it("returns true for 'can_manage_users'", () => {
      expect(isValidPermission('can_manage_users')).toBe(true);
    });

    it("returns false for 'invalid_perm'", () => {
      expect(isValidPermission('invalid_perm')).toBe(false);
    });

    it('returns false for an empty string', () => {
      expect(isValidPermission('')).toBe(false);
    });
  });

  describe('PERMISSION_CATALOG', () => {
    it('has 4 categories', () => {
      expect(PERMISSION_CATALOG).toHaveLength(4);
    });

    it('has the expected category names', () => {
      const categories = PERMISSION_CATALOG.map((c) => c.category);
      expect(categories).toContain('Catálogo');
      expect(categories).toContain('Ventas y Clientes');
      expect(categories).toContain('Finanzas');
      expect(categories).toContain('Administración');
    });
  });

  describe('CONFIGURABLE_ROLES', () => {
    it('does NOT include ADMIN', () => {
      const roleIds = CONFIGURABLE_ROLES.map((r) => r.id);
      expect(roleIds).not.toContain('ADMIN');
    });

    it('includes STAFF and VENDEDOR', () => {
      const roleIds = CONFIGURABLE_ROLES.map((r) => r.id);
      expect(roleIds).toContain('STAFF');
      expect(roleIds).toContain('VENDEDOR');
    });
  });

  describe('DEFAULT_PERMISSIONS', () => {
    it('VENDEDOR has 8 permissions', () => {
      expect(DEFAULT_PERMISSIONS.VENDEDOR).toHaveLength(8);
    });

    it('VENDEDOR includes can_edit_products and can_manage_cash', () => {
      expect(DEFAULT_PERMISSIONS.VENDEDOR).toContain('can_edit_products');
      expect(DEFAULT_PERMISSIONS.VENDEDOR).toContain('can_manage_cash');
    });

    it('VENDEDOR does NOT include can_edit_costs, can_edit_stock, can_manage_users', () => {
      expect(DEFAULT_PERMISSIONS.VENDEDOR).not.toContain('can_edit_costs');
      expect(DEFAULT_PERMISSIONS.VENDEDOR).not.toContain('can_edit_stock');
      expect(DEFAULT_PERMISSIONS.VENDEDOR).not.toContain('can_manage_users');
    });

    it('STAFF is an empty array', () => {
      expect(DEFAULT_PERMISSIONS.STAFF).toEqual([]);
      expect(DEFAULT_PERMISSIONS.STAFF).toHaveLength(0);
    });
  });
});
