import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ProfitabilityReportClient from './ProfitabilityReportClient';
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

describe('ProfitabilityReportClient', () => {
  const mockResponse = {
    grossProfit: { current: 150000, previous: 120000, change: 25 },
    grossMargin: { current: 60, previous: 55, change: 9.09 },
    revenue: { current: 250000, previous: 218181, change: 14.58 },
    totalCost: { current: 100000, previous: 98181, change: 1.85 },
    evolution: [
      { label: '01/06', revenue: 50000, cost: 20000, profit: 30000 },
      { label: '02/06', revenue: 100000, cost: 40000, profit: 60000 },
      { label: '03/06', revenue: 100000, cost: 40000, profit: 60000 },
    ],
    categoryProfitability: [
      { id: 'cat-1', name: 'Iluminación', revenue: 150000, profit: 90000, margin: 60 },
      { id: 'cat-2', name: 'Detailing', revenue: 100000, profit: 60000, margin: 60 },
    ],
    topProfitableItems: [
      { id: 'item-1', name: 'LED Headlight H7', quantity: 10, revenue: 80000, cost: 30000, profit: 50000, margin: 62.5 },
    ],
    technicianProfitability: [
      { technicianId: 'tech-1', technicianName: 'Carlos Gómez', revenue: 120000, cost: 40000, profit: 80000, margin: 66.7 },
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

  it('renders the profitability report and loads data successfully', async () => {
    render(
      <TooltipProvider>
        <ProfitabilityReportClient />
      </TooltipProvider>
    );

    // Header title should render
    expect(screen.getByText(/Reporte de Rentabilidad/i)).toBeInTheDocument();

    // Wait for mock data to load
    await waitFor(() => {
      // Check for elements loaded from fetch response (using getAllByText because they appear in both views)
      expect(screen.getAllByText(/LED Headlight/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Carlos Gómez/i)[0]).toBeInTheDocument();
    });

    // Verify key metrics are rendered (for example, gross profit or revenue)
    expect(screen.getAllByText(/Rentabilidad/i)[0]).toBeInTheDocument();
  });

  it('triggers window.print() when clicking the Imprimir button', async () => {
    render(
      <TooltipProvider>
        <ProfitabilityReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/LED Headlight/i)[0]).toBeInTheDocument();
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
        <ProfitabilityReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/LED Headlight/i)[0]).toBeInTheDocument();
    });

    // Verify corporate header in print view is rendered
    const companyHeader = screen.getAllByText(/RPM ACCESORIOS/i)[0];
    expect(companyHeader).toBeInTheDocument();

    // Verify print layout contains category and technician info
    expect(screen.getAllByText(/Carlos Gómez/i)[1]).toBeInTheDocument(); // Index 1 is the print-only table
    expect(screen.getAllByText(/ILUMINACIÓN/i)[1]).toBeInTheDocument(); // Index 1 is the print-only table

    // Auditor/Responsable blocks should be present
    expect(screen.getByText(/Responsable de Administración/i)).toBeInTheDocument();
    expect(screen.getByText(/Firma Autorizada Gerencia/i)).toBeInTheDocument();
  });
});
