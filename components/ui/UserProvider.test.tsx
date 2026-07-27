/**
 * Tests for components/ui/UserProvider.tsx
 * Validates the useUser hook: can(), isAdmin, role, and permissions.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserProvider, useUser } from '@/components/ui/UserProvider';

/** Test component that consumes the useUser hook and renders its values */
function TestComponent() {
  const { can, isAdmin, role, permissions } = useUser();
  return (
    <div>
      <span data-testid="role">{role}</span>
      <span data-testid="permissions">{permissions.join(',')}</span>
      <span data-testid="can-edit-costs">{can('can_edit_costs').toString()}</span>
      <span data-testid="can-edit-products">{can('can_edit_products').toString()}</span>
      <span data-testid="can-manage-users">{can('can_manage_users').toString()}</span>
      <span data-testid="is-admin">{isAdmin.toString()}</span>
    </div>
  );
}

describe('UserProvider / useUser', () => {
  describe('ADMIN user', () => {
    it('can() returns true for any permission and isAdmin is true', () => {
      render(
        <UserProvider
          user={{
            id: 'admin-1',
            name: 'Admin',
            email: 'admin@test.com',
            role: 'ADMIN',
            permissions: ['*'],
          }}
        >
          <TestComponent />
        </UserProvider>,
      );

      expect(screen.getByTestId('role').textContent).toBe('ADMIN');
      expect(screen.getByTestId('is-admin').textContent).toBe('true');
      expect(screen.getByTestId('can-edit-costs').textContent).toBe('true');
      expect(screen.getByTestId('can-edit-products').textContent).toBe('true');
      expect(screen.getByTestId('can-manage-users').textContent).toBe('true');
    });

    it('can() returns true even with empty permissions array', () => {
      render(
        <UserProvider
          user={{
            id: 'admin-1',
            name: 'Admin',
            email: 'admin@test.com',
            role: 'ADMIN',
            permissions: [],
          }}
        >
          <TestComponent />
        </UserProvider>,
      );

      expect(screen.getByTestId('is-admin').textContent).toBe('true');
      expect(screen.getByTestId('can-edit-costs').textContent).toBe('true');
    });
  });

  describe('VENDEDOR user with permissions', () => {
    it("can('can_edit_products') returns true, can('can_edit_costs') returns false", () => {
      render(
        <UserProvider
          user={{
            id: 'vendedor-1',
            name: 'Vendedor',
            email: 'vendedor@test.com',
            role: 'VENDEDOR',
            permissions: ['can_edit_products', 'can_manage_cash'],
          }}
        >
          <TestComponent />
        </UserProvider>,
      );

      expect(screen.getByTestId('role').textContent).toBe('VENDEDOR');
      expect(screen.getByTestId('is-admin').textContent).toBe('false');
      expect(screen.getByTestId('can-edit-products').textContent).toBe('true');
      expect(screen.getByTestId('can-edit-costs').textContent).toBe('false');
      expect(screen.getByTestId('can-manage-users').textContent).toBe('false');
    });
  });

  describe('VENDEDOR user with wildcard ["*"]', () => {
    it('can() returns true for any permission', () => {
      render(
        <UserProvider
          user={{
            id: 'vendedor-1',
            name: 'Vendedor',
            email: 'vendedor@test.com',
            role: 'VENDEDOR',
            permissions: ['*'],
          }}
        >
          <TestComponent />
        </UserProvider>,
      );

      expect(screen.getByTestId('is-admin').textContent).toBe('false');
      expect(screen.getByTestId('can-edit-costs').textContent).toBe('true');
      expect(screen.getByTestId('can-edit-products').textContent).toBe('true');
      expect(screen.getByTestId('can-manage-users').textContent).toBe('true');
    });
  });

  describe('STAFF user with empty permissions', () => {
    it('can() returns false for everything', () => {
      render(
        <UserProvider
          user={{
            id: 'staff-1',
            name: 'Staff',
            email: 'staff@test.com',
            role: 'STAFF',
            permissions: [],
          }}
        >
          <TestComponent />
        </UserProvider>,
      );

      expect(screen.getByTestId('role').textContent).toBe('STAFF');
      expect(screen.getByTestId('is-admin').textContent).toBe('false');
      expect(screen.getByTestId('can-edit-products').textContent).toBe('false');
      expect(screen.getByTestId('can-edit-costs').textContent).toBe('false');
      expect(screen.getByTestId('can-manage-users').textContent).toBe('false');
    });

    it('can() returns false when permissions is undefined', () => {
      render(
        <UserProvider
          user={{
            id: 'staff-1',
            name: 'Staff',
            email: 'staff@test.com',
            role: 'STAFF',
          }}
        >
          <TestComponent />
        </UserProvider>,
      );

      expect(screen.getByTestId('can-edit-products').textContent).toBe('false');
    });
  });

  describe('useUser outside UserProvider', () => {
    it('throws when used outside a UserProvider', () => {
      // Suppress console.error for the expected error
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<TestComponent />)).toThrow(
        'useUser must be used within a UserProvider',
      );
      spy.mockRestore();
    });
  });
});
