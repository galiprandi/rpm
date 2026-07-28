import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import SalesReportClient from './SalesReportClient';
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

describe('SalesReportClient', () => {
  const mockResponse = {
    totalSales: { current: 500000, previous: 400000, change: 25 },
    orderCount: { current: 50, previous: 40, change: 25 },
    ticketAverage: { current: 10000, previous: 10000, change: 0 },
    evolution: [
      { label: '01/06', total: 200000, count: 20 },
      { label: '02/06', total: 300000, count: 30 },
    ],
    categoryDistribution: [
      { id: '1', name: 'Iluminación LED', total: 300000, color: '#3b82f6' },
      { id: '2', name: 'Audio DSP', total: 200000, color: '#ef4444' },
    ],
    topProducts: [
      { id: 'p1', name: 'Bi-LED Projector X1', quantity: 15, total: 150000 },
      { id: 'p2', name: 'Subwoofer Alpine 10', quantity: 10, total: 100000 },
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

  it('renders the sales report and loads data successfully', async () => {
    render(
      <TooltipProvider>
        <SalesReportClient />
      </TooltipProvider>
    );

    // Header title should render
    expect(screen.getByText(/Reporte de Ventas/i)).toBeInTheDocument();

    // Wait for mock data to load
    await waitFor(() => {
      // Check for elements loaded from fetch response (using getAllByText because they appear in both views)
      expect(screen.getAllByText(/Iluminación LED/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Bi-LED Projector X1/i)[0]).toBeInTheDocument();
    });

    // Verify key metrics titles/descriptions are rendered
    expect(screen.getAllByText(/Ventas Totales/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Cantidad de Ventas/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Ticket Promedio/i)[0]).toBeInTheDocument();
  });

  it('triggers window.print() when clicking the Imprimir button', async () => {
    render(
      <TooltipProvider>
        <SalesReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Iluminación LED/i)[0]).toBeInTheDocument();
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
        <SalesReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Iluminación LED/i)[0]).toBeInTheDocument();
    });

    // Verify corporate header in print view is rendered
    const companyHeader = screen.getAllByText(/RPM ACCESORIOS/i)[0];
    expect(companyHeader).toBeInTheDocument();

    // Verify print layout contains category and products info (using getAllByText to count printed view duplicates)
    expect(screen.getAllByText(/Iluminación LED/i)[1]).toBeInTheDocument(); // Index 1 is the print-only table
    expect(screen.getAllByText(/Bi-LED Projector X1/i)[1]).toBeInTheDocument(); // Index 1 is the print-only table

    // Auditor/Responsable blocks should be present
    expect(screen.getByText(/Responsable de Ventas/i)).toBeInTheDocument();
    expect(screen.getByText(/Firma Autorizada Gerencia/i)).toBeInTheDocument();
  });
});
