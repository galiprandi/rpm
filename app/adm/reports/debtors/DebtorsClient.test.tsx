import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import DebtorsClient from './DebtorsClient';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock UI Provider
vi.mock('@/components/ui/UIProvider', () => ({
  useUI: () => ({
    alert: vi.fn(),
  }),
}));

// Mock Header and CrudStats
vi.mock('@/components/adm', () => ({
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
  CrudStats: ({ stats }: any) => (
    <div data-testid="stats">
      {stats?.map((stat: any, idx: number) => (
        <div key={idx} data-testid={`stat-${idx}`}>
          <span>{stat.label}</span>: <span>{stat.value}</span>
        </div>
      ))}
    </div>
  ),
}));

// Mock DataTable to avoid complexity of full TanStack Table rendering in test
vi.mock('@/components/ui/data-table', () => ({
  DataTable: ({ data, emptyMessage }: any) => (
    <div data-testid="data-table">
      {data.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <table>
          <tbody>
            {data.map((item: any, idx: number) => (
              <tr key={idx}>
                <td>{item.customerName}</td>
                <td>{item.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  ),
}));

// Mock window.print
const printMock = vi.fn();
if (typeof window !== 'undefined') {
  window.print = printMock;
}

describe('DebtorsClient', () => {
  const mockResponse = {
    debtors: [
      {
        customerId: 'cust-1',
        customerName: 'Juan Pérez',
        phone: '3411234567',
        phoneAlt: null,
        email: 'juan@example.com',
        balance: 15000,
        workOrderDebt: 10000,
        directSaleDebt: 5000,
        creditNoteCredit: 0,
        workOrderCount: 2,
        directSaleCount: 1,
        oldestDebtDate: '2024-06-01T12:00:00.000Z',
        pendingWorkOrdersTotal: 10000,
        vehicles: ['AAA123', 'BBB456'],
        recentWorkOrders: [],
      },
    ],
    summary: {
      totalDebt: 15000,
      totalCustomers: 1,
      totalWorkOrders: 2,
      totalDirectSales: 1,
      averageDebt: 15000,
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

  it('renders the debtors report and loads data successfully', async () => {
    render(
      <TooltipProvider>
        <DebtorsClient />
      </TooltipProvider>
    );

    // Header title should render
    expect(screen.getByText('Reporte de Deudores')).toBeInTheDocument();

    // Data-table should render with the mock customer data after loading
    await waitFor(() => {
      const matches = screen.getAllByText('Juan Pérez');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]).toBeInTheDocument();
    });

    // Verify stats are rendered
    expect(screen.getByTestId('stats')).toBeInTheDocument();
  });

  it('triggers window.print() when clicking the Imprimir button', async () => {
    render(
      <TooltipProvider>
        <DebtorsClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      const matches = screen.getAllByText('Juan Pérez');
      expect(matches.length).toBeGreaterThan(0);
    });

    // Find and click the Print button
    const printBtn = screen.getByRole('button', { name: /Imprimir/i });
    expect(printBtn).toBeInTheDocument();
    expect(printBtn).not.toBeDisabled();

    printBtn.click();

    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it('renders the print-only view container with the correct info', async () => {
    render(
      <TooltipProvider>
        <DebtorsClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      const matches = screen.getAllByText('Juan Pérez');
      expect(matches.length).toBeGreaterThan(0);
    });

    // Verify corporate header in print view is rendered
    const companyHeader = screen.getAllByText('RPM ACCESORIOS')[0];
    expect(companyHeader).toBeInTheDocument();

    // Print table should show vehicle plates
    expect(screen.getByText('AAA123, BBB456')).toBeInTheDocument();

    // Auditor/Responsable block should be present
    expect(screen.getByText('Auditor / Responsable de Finanzas')).toBeInTheDocument();
    expect(screen.getByText('Firma Autorizada RPM')).toBeInTheDocument();
  });
});
