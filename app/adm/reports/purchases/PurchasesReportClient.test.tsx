import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import PurchasesReportClient from './PurchasesReportClient';
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

describe('PurchasesReportClient', () => {
  const mockResponse = {
    totalPurchases: { current: 350000, previous: 250000, change: 40 },
    voucherCount: { current: 15, previous: 10, change: 50 },
    averageVoucher: { current: 23333.33, previous: 25000, change: -6.67 },
    evolution: [
      { label: '01/06', total: 150000, count: 5 },
      { label: '02/06', total: 200000, count: 10 },
    ],
    supplierDistribution: [
      { supplierId: 's1', supplierName: 'Distribuidora Warnes', total: 250000, count: 10 },
      { supplierId: 's2', supplierName: 'Sistemas LED S.A.', total: 100000, count: 5 },
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

  it('renders the purchases report and loads data successfully', async () => {
    render(
      <TooltipProvider>
        <PurchasesReportClient />
      </TooltipProvider>
    );

    // Header title should render
    expect(screen.getByText(/Reporte de Compras/i)).toBeInTheDocument();

    // Wait for mock data to load
    await waitFor(() => {
      // Check for elements loaded from fetch response (using getAllByText because they appear in both views)
      expect(screen.getAllByText(/Distribuidora Warnes/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Sistemas LED S.A./i)[0]).toBeInTheDocument();
    });

    // Verify key metrics titles are rendered
    expect(screen.getAllByText(/Compras Totales/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Cantidad de Comprobantes/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Comprobante Promedio/i)[0]).toBeInTheDocument();
  });

  it('triggers window.print() when clicking the Imprimir button', async () => {
    render(
      <TooltipProvider>
        <PurchasesReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Distribuidora Warnes/i)[0]).toBeInTheDocument();
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
        <PurchasesReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Distribuidora Warnes/i)[0]).toBeInTheDocument();
    });

    // Verify corporate header in print view is rendered
    const companyHeader = screen.getAllByText(/RPM ACCESORIOS/i)[0];
    expect(companyHeader).toBeInTheDocument();

    // Verify print layout contains supplier info (using getAllByText to count printed view duplicates)
    expect(screen.getAllByText(/Distribuidora Warnes/i)[1]).toBeInTheDocument(); // Index 1 is the print-only table
    expect(screen.getAllByText(/Sistemas LED S.A./i)[1]).toBeInTheDocument(); // Index 1 is the print-only table

    // Auditor/Responsable blocks should be present
    expect(screen.getByText(/Responsable de Compras/i)).toBeInTheDocument();
    expect(screen.getByText(/Firma Autorizada Gerencia/i)).toBeInTheDocument();
  });
});
