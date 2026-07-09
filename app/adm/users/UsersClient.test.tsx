import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UsersClient from './UsersClient';
import React from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock components and hooks
vi.mock('@/components/adm', () => ({
  Header: () => <div data-testid="header" />,
  CrudAdmin: ({ columns, items, rowActions }: any) => (
    <table>
      <tbody>
        {items.map((item: any) => (
          <tr key={item.id}>
            {columns.map((col: any, i: number) => (
              <td key={i}>
                {typeof col.cell === 'function'
                  ? col.cell({ row: { original: item } })
                  : item[col.accessorKey]}
              </td>
            ))}
            <td>{rowActions(item)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  CrudStats: () => <div data-testid="stats" />,
}));

vi.mock('@/components/users/UserDialog', () => ({
  UserDialog: () => <div data-testid="user-dialog" />
}));

vi.mock('@/components/ui/UIProvider', () => ({
  useUI: () => ({
    alert: vi.fn(),
  })
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Users: () => <div data-testid="icon-users" />,
  Pencil: () => <div data-testid="icon-pencil" />,
  UserCog: () => <div data-testid="icon-usercog" />,
  Shield: () => <div data-testid="icon-shield" />,
  Plus: () => <div data-testid="icon-plus" />,
  CheckCircle2: () => <div data-testid="icon-checkcircle2" />,
}));

describe('UsersClient', () => {
  const mockUsers = [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      image: null,
      role: 'ADMIN',
      isActive: true,
      notes: 'This is a test note that should be truncated and show a tooltip',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('renders the notes column with a tooltip trigger', () => {
    render(
      <TooltipProvider>
        <UsersClient initialUsers={mockUsers} />
      </TooltipProvider>
    );

    const noteElement = screen.getByText(/This is a test note/i);
    expect(noteElement).toBeInTheDocument();
    expect(noteElement).toHaveClass('truncate');
    expect(noteElement).toHaveClass('cursor-help');
  });
});
