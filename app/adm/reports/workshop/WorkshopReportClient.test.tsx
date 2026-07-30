import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import WorkshopReportClient from './WorkshopReportClient';
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

describe('WorkshopReportClient', () => {
  const mockResponse = {
    totalOrders: { current: 30, previous: 20, change: 50 },
    completedOrders: { current: 25, previous: 15, change: 66.7 },
    avgResolutionTime: { current: 4.5, previous: 6.0, change: -25 },
    statusDistribution: [
      { status: 'CONFIRMED', count: 10, label: 'Confirmada' },
      { status: 'IN_PROGRESS', count: 12, label: 'En Proceso' },
      { status: 'READY', count: 8, label: 'Listo' },
    ],
    technicianPerformance: [
      { technicianId: 't1', technicianName: 'Juan Pérez', assignedCount: 15, completedCount: 10 },
      { technicianId: 't2', technicianName: 'Santi Gómez', assignedCount: 15, completedCount: 15 },
    ],
    evolution: [
      { date: '2026-06-01', label: '01/06', created: 5, completed: 3 },
      { date: '2026-06-02', label: '02/06', created: 10, completed: 8 },
    ],
    groupBy: 'day',
    generatedAt: new Date().toISOString(),
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

  it('renders the workshop report and loads data successfully', async () => {
    render(
      <TooltipProvider>
        <WorkshopReportClient />
      </TooltipProvider>
    );

    // Header title should render
    expect(screen.getByText(/Reporte de Taller & Operación/i)).toBeInTheDocument();

    // Wait for mock data to load
    await waitFor(() => {
      // Check for elements loaded from fetch response
      expect(screen.getAllByText(/Juan Pérez/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/En Proceso/i)[0]).toBeInTheDocument();
    });

    // Verify key metrics titles/descriptions are rendered
    expect(screen.getAllByText(/OTs Creadas/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/OTs Completadas/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Tiempo de Resolución/i)[0]).toBeInTheDocument();
  });

  it('triggers window.print() when clicking the Imprimir button', async () => {
    render(
      <TooltipProvider>
        <WorkshopReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Juan Pérez/i)[0]).toBeInTheDocument();
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
        <WorkshopReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Juan Pérez/i)[0]).toBeInTheDocument();
    });

    // Verify corporate header in print view is rendered
    const companyHeader = screen.getAllByText(/RPM ACCESORIOS/i)[0];
    expect(companyHeader).toBeInTheDocument();

    // Verify print layout contains status distribution and technician info
    expect(screen.getAllByText(/En Proceso/i)[1]).toBeInTheDocument(); // Index 1 is the print-only table
    expect(screen.getAllByText(/Juan Pérez/i)[1]).toBeInTheDocument(); // Index 1 is the print-only table

    // Auditor/Responsable blocks should be present
    expect(screen.getByText(/Responsable de Taller/i)).toBeInTheDocument();
    expect(screen.getByText(/Firma Autorizada Gerencia/i)).toBeInTheDocument();
  });

  it('supports CSV export', async () => {
    const createObjectURLMock = vi.fn(() => 'blob:url');
    const revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock as any;
    global.URL.revokeObjectURL = revokeObjectURLMock as any;

    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    render(
      <TooltipProvider>
        <WorkshopReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Juan Pérez/i)[0]).toBeInTheDocument();
    });

    const csvBtn = screen.getByRole('button', { name: /Exportar CSV/i });
    expect(csvBtn).toBeInTheDocument();
    expect(csvBtn).not.toBeDisabled();

    csvBtn.click();

    expect(createObjectURLMock).toHaveBeenCalled();
  });
});
