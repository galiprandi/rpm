import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import FinanceReportClient from './FinanceReportClient';
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

describe('FinanceReportClient', () => {
  const mockResponse = {
    totalIncome: { current: 300000, previous: 250000, change: 20 },
    totalExpense: { current: 120000, previous: 100000, change: 20 },
    netFlow: { current: 180000, previous: 150000, change: 20 },
    evolution: [
      { label: '01/06', income: 100000, expense: 40000 },
      { label: '02/06', income: 200000, expense: 80000 },
    ],
    methodDistribution: [
      { method: 'EFECTIVO', income: 150000, expense: 20000, net: 130000 },
      { method: 'TRANSFERENCIA', income: 150000, expense: 100000, net: 50000 },
    ],
    groupBy: 'day',
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

  it('renders the finance report and loads data successfully', async () => {
    render(
      <TooltipProvider>
        <FinanceReportClient />
      </TooltipProvider>
    );

    // Header title should render
    expect(screen.getByText(/Reporte de Finanzas & Flujo/i)).toBeInTheDocument();

    // Wait for mock data to load
    await waitFor(() => {
      // Check for elements loaded from fetch response (using getAllByText because they appear in both views)
      expect(screen.getAllByText(/EFECTIVO/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/TRANSFERENCIA/i)[0]).toBeInTheDocument();
    });

    // Verify key metrics titles/descriptions are rendered
    expect(screen.getAllByText(/Ingresos Totales/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Egresos Totales/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Flujo Neto/i)[0]).toBeInTheDocument();
  });

  it('triggers window.print() when clicking the Imprimir button', async () => {
    render(
      <TooltipProvider>
        <FinanceReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/EFECTIVO/i)[0]).toBeInTheDocument();
    });

    // Find and click the Print button in the mocked Header actions
    const printBtn = screen.getByRole('button', { name: /Imprimir/i });
    expect(printBtn).toBeInTheDocument();
    expect(printBtn).not.toBeDisabled();

    printBtn.click();

    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it('renders the print-only view container with the correct info', async () => {
    render(
      <TooltipProvider>
        <FinanceReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/EFECTIVO/i)[0]).toBeInTheDocument();
    });

    // Verify corporate header in print view is rendered
    const companyHeader = screen.getAllByText(/RPM ACCESORIOS/i)[0];
    expect(companyHeader).toBeInTheDocument();

    // Verify print layout contains method and evolution info
    expect(screen.getAllByText(/EFECTIVO/i)[1]).toBeInTheDocument(); // Index 1 is the print-only table
    expect(screen.getAllByText(/TRANSFERENCIA/i)[1]).toBeInTheDocument(); // Index 1 is the print-only table

    // Auditor/Responsable blocks should be present
    expect(screen.getByText(/Responsable de Administración/i)).toBeInTheDocument();
    expect(screen.getByText(/Firma Autorizada Gerencia/i)).toBeInTheDocument();
  });
});
