import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryForm, type CategoryFormData } from './CategoryForm';
import React from 'react';

// Mock Lucide icons to simplify DOM inspection
vi.mock('lucide-react', () => ({
  Folder: () => <div data-testid="icon-folder" />,
  FileText: () => <div data-testid="icon-filetext" />,
  TrendingUp: () => <div data-testid="icon-trendingup" />,
  Palette: () => <div data-testid="icon-palette" />,
}));

describe('CategoryForm', () => {
  const mockFormData: CategoryFormData = {
    name: 'Test Category',
    description: 'Test Description',
    defaultMarginPercent: 40,
    color: '#ff0000',
  };
  const mockSetFormData = vi.fn();

  it('renders all fields with their respective icons', () => {
    render(
      <CategoryForm formData={mockFormData} setFormData={mockSetFormData} />
    );

    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-folder')).toBeInTheDocument();

    expect(screen.getByLabelText(/Descripción/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-filetext')).toBeInTheDocument();

    expect(screen.getByLabelText(/Margen Sugerido/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-trendingup')).toBeInTheDocument();

    expect(screen.getByLabelText(/Color Visual/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-palette')).toBeInTheDocument();
  });

  it('applies pl-9 class to inputs for icon spacing', () => {
    render(
      <CategoryForm formData={mockFormData} setFormData={mockSetFormData} />
    );

    expect(screen.getByLabelText(/Nombre/i)).toHaveClass('pl-9');
    expect(screen.getByLabelText(/Descripción/i)).toHaveClass('pl-9');
    expect(screen.getByLabelText(/Margen Sugerido/i)).toHaveClass('pl-9');
  });

  it('uses required prop on Name label and aria-required on Input', () => {
    render(
      <CategoryForm formData={mockFormData} setFormData={mockSetFormData} />
    );

    const nameInput = screen.getByLabelText(/Nombre/i);
    expect(nameInput).toBeRequired();
    expect(nameInput).toHaveAttribute('aria-required', 'true');
  });
});
