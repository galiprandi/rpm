import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ServicesReportClient from './ServicesReportClient';
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

describe('ServicesReportClient', () => {
  const mockResponse = {
    totalServiceRevenue: { current: 150000, previous: 120000, change: 25 },
    serviceCount: { current: 30, previous: 25, change: 20 },
    averageServicePrice: { current: 5000, previous: 4800, change: 4.17 },
    evolution: [
      { date: '2026-07-01', label: '01/07', total: 50000, count: 10 },
      { date: '2026-07-02', label: '02/07', total: 100000, count: 20 },
    ],
    topServices: [
      { id: 'service-1', name: 'Tratamiento Cerámico Premium', total: 90000, quantity: 15 },
      { id: 'service-2', name: 'Instalación Bi-LED', total: 60000, quantity: 15 },
    ],
    vehicleCategoryDistribution: [
      { category: 'SUV', total: 100000, count: 20 },
      { category: 'Sedán', total: 50000, count: 10 },
    ],
    technicianPerformance: [
      { technicianId: 'tech-1', technicianName: 'Juan Pérez', totalRevenue: 120000, serviceCount: 24 },
    ],
    groupBy: 'day',
    generatedAt: '2026-07-31T12:00:00.000Z',
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

  it('renders the services report and loads data successfully', async () => {
    render(
      <TooltipProvider>
        <ServicesReportClient />
      </TooltipProvider>
    );

    // Header title should render
    expect(screen.getByText(/Reporte de Servicios/i)).toBeInTheDocument();

    // Wait for mock data to load
    await waitFor(() => {
      // Check for elements loaded from fetch response (using getAllByText because they appear in both views)
      expect(screen.getAllByText(/Tratamiento Cerámico/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Juan Pérez/i)[0]).toBeInTheDocument();
    });

    // Verify key metrics are rendered
    expect(screen.getAllByText(/Ingresos por Servicios/i)[0]).toBeInTheDocument();
  });

  it('triggers window.print() when clicking the Imprimir button', async () => {
    render(
      <TooltipProvider>
        <ServicesReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Tratamiento Cerámico/i)[0]).toBeInTheDocument();
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
        <ServicesReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Tratamiento Cerámico/i)[0]).toBeInTheDocument();
    });

    // Verify corporate header in print view is rendered
    const companyHeader = screen.getAllByText(/RPM ACCESORIOS/i)[0];
    expect(companyHeader).toBeInTheDocument();

    // Verify print layout contains category and technician info
    expect(screen.getAllByText(/Juan Pérez/i)[1]).toBeInTheDocument(); // Index 1 is the print-only table
    expect(screen.getAllByText(/SUV/i)[1]).toBeInTheDocument(); // Index 1 is the print-only table

    // Auditor/Responsable blocks should be present
    expect(screen.getByText(/Auditor de Servicios/i)).toBeInTheDocument();
    expect(screen.getByText(/Firma Autorizada Gerencia/i)).toBeInTheDocument();
  });
});
