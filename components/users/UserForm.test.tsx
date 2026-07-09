import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserForm, type UserFormData } from './UserForm';
import React from 'react';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Mail: () => <div data-testid="icon-mail" />,
  User: () => <div data-testid="icon-user" />,
  FileText: () => <div data-testid="icon-filetext" />,
  Shield: () => <div data-testid="icon-shield" />, // Used in UserRoleSelect
  ChevronDown: () => <div data-testid="icon-chevrondown" />, // Used in UserRoleSelect
}));

// Mock UserRoleSelect since it's used in UserForm
vi.mock('./UserRoleSelect', () => ({
  UserRoleSelect: ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
    <select id="role" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="USER">User</option>
      <option value="ADMIN">Admin</option>
    </select>
  )
}));

describe('UserForm', () => {
  const mockFormData: UserFormData = {
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    notes: 'Test Notes',
  };
  const mockSetFormData = vi.fn();

  it('renders all fields with their respective icons', () => {
    render(
      <UserForm formData={mockFormData} setFormData={mockSetFormData} />
    );

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-mail')).toBeInTheDocument();

    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-user')).toBeInTheDocument();

    expect(screen.getByLabelText(/Rol/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/Notas/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-filetext')).toBeInTheDocument();
  });

  it('applies pl-9 class to inputs for icon spacing', () => {
    render(
      <UserForm formData={mockFormData} setFormData={mockSetFormData} />
    );

    expect(screen.getByLabelText(/Email/i)).toHaveClass('pl-9');
    expect(screen.getByLabelText(/Nombre/i)).toHaveClass('pl-9');
    expect(screen.getByLabelText(/Notas/i)).toHaveClass('pl-9');
  });

  it('uses font-mono for the email field', () => {
    render(
      <UserForm formData={mockFormData} setFormData={mockSetFormData} />
    );

    expect(screen.getByLabelText(/Email/i)).toHaveClass('font-mono');
  });

  it('uses required prop on labels and aria-required on inputs for mandatory fields', () => {
    render(
      <UserForm formData={mockFormData} setFormData={mockSetFormData} />
    );

    const emailInput = screen.getByLabelText(/Email/i);
    expect(emailInput).toBeRequired();
    expect(emailInput).toHaveAttribute('aria-required', 'true');

    const nameInput = screen.getByLabelText(/Nombre/i);
    expect(nameInput).toBeRequired();
    expect(nameInput).toHaveAttribute('aria-required', 'true');
  });
});
