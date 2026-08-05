import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { DailyOperations } from '@/components/dashboard/DailyOperations';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/adm/operations',
}));

// Mock the UI components/hooks that may cause issues
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

describe('DailyOperations component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correct hrefs for different movement types (work_order vs direct_sale)', async () => {
    const mockData = {
      summary: {
        totalIncome: 10000,
        totalExpense: 2000,
        netAmount: 8000,
      },
      movements: [
        {
          id: 'mov-1',
          type: 'INCOME',
          amount: 6000,
          method: 'CASH',
          methodName: 'Efectivo',
          createdAt: new Date().toISOString(),
          customer: { id: 'cust-1', name: 'Juan Perez' },
          relatedId: 'wo-123',
          relatedType: 'work_order',
          reason: 'Pago de orden de trabajo #wo-123',
        },
        {
          id: 'mov-2',
          type: 'INCOME',
          amount: 4000,
          method: 'TRANSFER',
          methodName: 'Transferencia',
          createdAt: new Date().toISOString(),
          customer: { id: 'cust-2', name: 'Maria Gomez' },
          relatedId: 'ds-456',
          relatedType: 'direct_sale',
          reason: 'Venta directa #ds-456',
        },
      ],
    };

    // Mock the global fetch to return mockData
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as any);

    render(
      <TooltipProvider>
        <DailyOperations />
      </TooltipProvider>
    );

    // Wait for data to load and render
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
      expect(screen.getByText('Maria Gomez')).toBeInTheDocument();
    });

    // Find the link/anchor for the work order row
    const workOrderLink = screen.getByLabelText('Ver detalle de la operación', {
      selector: 'a[href*="work-orders"]',
    });
    expect(workOrderLink).toBeInTheDocument();
    expect(workOrderLink.getAttribute('href')).toBe('/adm/work-orders/wo-123');

    // Find the link/anchor for the direct sale row
    const directSaleLink = screen.getByLabelText('Ver detalle de la operación', {
      selector: 'a[href*="direct-sales"]',
    });
    expect(directSaleLink).toBeInTheDocument();
    expect(directSaleLink.getAttribute('href')).toBe('/adm/direct-sales/ds-456');
  });
});
