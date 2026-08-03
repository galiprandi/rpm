import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ReportsClient from './ReportsClient';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock UI Provider
vi.mock('@/components/ui/UIProvider', () => ({
  useUI: () => ({
    alert: vi.fn(),
  }),
}));

// Mock Header
vi.mock('@/components/adm/Header', () => ({
  Header: ({ title, description, secondaryActions }: any) => (
    <div data-testid="header">
      <h1>{title}</h1>
      <p>{description}</p>
      {secondaryActions?.map((action: any, idx: number) => (
        <button key={idx} onClick={action.onClick} disabled={action.disabled}>
          {action.label}
        </button>
      ))}
    </div>
  ),
}));

// Mock window.print
const printMock = vi.fn();
if (typeof window !== 'undefined') {
  window.print = printMock;
}

describe('ReportsClient', () => {
  const mockResponse = {
    revenue: { current: 1500000, previous: 1200000, change: 25 },
    estimatedProfit: { current: 450000, previous: 360000, change: 25 },
    completedOrders: { current: 85, previous: 80, change: 6.25 },
    newCustomers: { current: 24, previous: 20, change: 20 },
    stockStatus: {
      totalValue: 3500000,
      lowStockCount: 5,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    printMock.mockClear();

    // Mock global fetch
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    ) as any;
  });

  it('renders the reports dashboard overview and loads data successfully', async () => {
    render(
      <TooltipProvider>
        <ReportsClient />
      </TooltipProvider>
    );

    // Header title should render
    expect(screen.getByText(/Centro de Reportes/i)).toBeInTheDocument();

    // Wait for mock data to load using getAllByText to avoid duplicate-element exceptions
    await waitFor(() => {
      expect(screen.getAllByText(/Valorización Total:/i)[0]).toBeInTheDocument();
    });

    // Check key metrics values (using getAllByText because they appear in multiple cards or lists or the print view)
    expect(screen.getAllByText(/Ingresos Totales/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Rentabilidad Est./i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/OTs Completadas/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Clientes Nuevos/i)[0]).toBeInTheDocument();
  });

  it('triggers window.print() when clicking the Imprimir button', async () => {
    render(
      <TooltipProvider>
        <ReportsClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Valorización Total:/i)[0]).toBeInTheDocument();
    });

    // Find and click the Print button in the mocked Header actions
    const printBtn = screen.getByRole('button', { name: /Imprimir/i });
    expect(printBtn).toBeInTheDocument();
    expect(printBtn).not.toBeDisabled();

    printBtn.click();

    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it('renders the high-fidelity print container with expected corporate contents', async () => {
    render(
      <TooltipProvider>
        <ReportsClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Valorización Total:/i)[0]).toBeInTheDocument();
    });

    // Verify corporate header in print view is rendered (using getAllByText since RPM Accesorios is mocked/rendered in different headers)
    const companyHeader = screen.getAllByText(/RPM ACCESORIOS/i)[0];
    expect(companyHeader).toBeInTheDocument();

    // Verify print layout metadata and titles
    expect(screen.getByText(/Consolidado de Negocios & BI/i)).toBeInTheDocument();
    expect(screen.getByText(/Comparativo de Rendimiento Interperíodo/i)).toBeInTheDocument();

    // Control signatures should be present
    expect(screen.getByText(/Responsable de Reportes y BI/i)).toBeInTheDocument();
    expect(screen.getByText(/Firma Autorizada Gerencia/i)).toBeInTheDocument();
  });
});
