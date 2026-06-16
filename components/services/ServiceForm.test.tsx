import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServiceForm, type ServiceFormData } from './ServiceForm';
import React from 'react';

// Mock Lucide icons to simplify DOM inspection
vi.mock('lucide-react', () => ({
  Wrench: () => <div data-testid="icon-wrench" />,
  FileText: () => <div data-testid="icon-filetext" />,
  DollarSign: () => <div data-testid="icon-dollarsign" />,
  Clock: () => <div data-testid="icon-clock" />,
  Truck: () => <div data-testid="icon-truck" />,
}));

describe('ServiceForm', () => {
  const mockFormData: ServiceFormData = {
    name: 'Test Service',
    description: 'Test Description',
    baseCost: '15000',
    timeMinutes: '60',
    vehicleFactor: '1.0',
  };
  const mockOnChange = vi.fn();

  it('renders all fields with their respective icons', () => {
    render(
      <ServiceForm formData={mockFormData} onChange={mockOnChange} />
    );

    expect(screen.getByLabelText(/Nombre del Servicio/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-wrench')).toBeInTheDocument();

    expect(screen.getByLabelText(/Descripción/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-filetext')).toBeInTheDocument();

    expect(screen.getByLabelText(/Costo Base/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-dollarsign')).toBeInTheDocument();

    expect(screen.getByLabelText(/Tiempo/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-clock')).toBeInTheDocument();

    expect(screen.getByLabelText(/Factor Vehículo/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-truck')).toBeInTheDocument();
  });

  it('applies pl-9 class to inputs for icon spacing', () => {
    render(
      <ServiceForm formData={mockFormData} onChange={mockOnChange} />
    );

    expect(screen.getByLabelText(/Nombre del Servicio/i)).toHaveClass('pl-9');
    expect(screen.getByLabelText(/Descripción/i)).toHaveClass('pl-9');
    expect(screen.getByLabelText(/Costo Base/i)).toHaveClass('pl-9');
    expect(screen.getByLabelText(/Tiempo/i)).toHaveClass('pl-9');
    expect(screen.getByLabelText(/Factor Vehículo/i)).toHaveClass('pl-9');
  });

  it('uses required prop on Name, Cost and Time labels and aria-required on Inputs', () => {
    render(
      <ServiceForm formData={mockFormData} onChange={mockOnChange} />
    );

    const nameInput = screen.getByLabelText(/Nombre del Servicio/i);
    expect(nameInput).toBeRequired();
    expect(nameInput).toHaveAttribute('aria-required', 'true');

    const costInput = screen.getByLabelText(/Costo Base/i);
    expect(costInput).toBeRequired();
    expect(costInput).toHaveAttribute('aria-required', 'true');

    const timeInput = screen.getByLabelText(/Tiempo/i);
    expect(timeInput).toBeRequired();
    expect(timeInput).toHaveAttribute('aria-required', 'true');
  });

  it('applies font-mono class to technical numerical fields', () => {
    render(
      <ServiceForm formData={mockFormData} onChange={mockOnChange} />
    );

    expect(screen.getByLabelText(/Costo Base/i)).toHaveClass('font-mono');
    expect(screen.getByLabelText(/Tiempo/i)).toHaveClass('font-mono');
    expect(screen.getByLabelText(/Factor Vehículo/i)).toHaveClass('font-mono');
  });
});
