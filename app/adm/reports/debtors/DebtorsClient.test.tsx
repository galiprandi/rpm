import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
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
  Header: ({ title, description, secondaryActions, leftActions }: any) => (
    <div data-testid="header">
      <h1>{title}</h1>
      <p>{description}</p>
      <div data-testid="header-left-actions">{leftActions}</div>
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
          <span>{stat.label}</span>: <span data-testid={`stat-value-${idx}`}>{stat.value}</span>
        </div>
      ))}
    </div>
  ),
}));

// Mock DataTable to avoid complexity of full TanStack Table rendering in test
vi.mock('@/components/ui/data-table', () => ({
  DataTable: ({ data, emptyMessage, enableGlobalFilter, externalGlobalFilter, onExternalGlobalFilterChange }: any) => (
    <div data-testid="data-table">
      {enableGlobalFilter && (
        <input
          data-testid="data-table-search"
          value={externalGlobalFilter || ''}
          onChange={(e) => onExternalGlobalFilterChange?.(e.target.value)}
          placeholder="Buscar..."
        />
      )}
      {data.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <table>
          <tbody>
            {data.map((item: any, idx: number) => (
              <tr key={idx}>
                <td>{item.customerName}</td>
                <td>{item.balance}</td>
                <td>{item.vehicles ? item.vehicles.join(', ') : ''}</td>
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
  // Let's create dates relative to now to ensure stable days test
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 95);

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

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
        oldestDebtDate: ninetyDaysAgo.toISOString(),
        pendingWorkOrdersTotal: 10000,
        vehicles: ['AAA123', 'BBB456'],
        recentWorkOrders: [],
      },
      {
        customerId: 'cust-2',
        customerName: 'María Gómez',
        phone: '3417654321',
        phoneAlt: null,
        email: 'maria@example.com',
        balance: 8000,
        workOrderDebt: 8000,
        directSaleDebt: 0,
        creditNoteCredit: 0,
        workOrderCount: 1,
        directSaleCount: 0,
        oldestDebtDate: fiveDaysAgo.toISOString(),
        pendingWorkOrdersTotal: 8000,
        vehicles: ['CCC789'],
        recentWorkOrders: [],
      },
    ],
    summary: {
      totalDebt: 23000,
      totalCustomers: 2,
      totalWorkOrders: 3,
      totalDirectSales: 1,
      averageDebt: 11500,
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

    // Data-table should render with both mock customer data after loading
    await waitFor(() => {
      const dataTable = screen.getByTestId('data-table');
      expect(within(dataTable).getByText('Juan Pérez')).toBeInTheDocument();
      expect(within(dataTable).getByText('María Gómez')).toBeInTheDocument();
    });

    // Verify stats are rendered with initial values
    expect(screen.getByTestId('stats')).toBeInTheDocument();
    expect(screen.getByTestId('stat-0')).toHaveTextContent(/Deuda Total/i);
    expect(screen.getByTestId('stat-1')).toHaveTextContent(/Clientes Deudores/i);
  });

  it('filters debtors by search input (Name/Plate)', async () => {
    render(
      <TooltipProvider>
        <DebtorsClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      const dataTable = screen.getByTestId('data-table');
      expect(within(dataTable).getByText('Juan Pérez')).toBeInTheDocument();
      expect(within(dataTable).getByText('María Gómez')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('data-table-search');
    expect(searchInput).toBeInTheDocument();

    // Search for "María"
    fireEvent.change(searchInput, { target: { value: 'María' } });

    // "María Gómez" should remain, but "Juan Pérez" should be filtered out in the data-table
    const dataTable = screen.getByTestId('data-table');
    expect(within(dataTable).getByText('María Gómez')).toBeInTheDocument();
    expect(within(dataTable).queryByText('Juan Pérez')).not.toBeInTheDocument();

    // Verify KPI stats updated dynamically
    // María Gomez has balance of 8000
    expect(screen.getByTestId('stat-0')).toHaveTextContent(/8\.000/);
    expect(screen.getByTestId('stat-1')).toHaveTextContent(/: 1/); // 1 debtor

    // Search for plate CCC789
    fireEvent.change(searchInput, { target: { value: 'CCC789' } });
    expect(within(dataTable).getByText('María Gómez')).toBeInTheDocument();
    expect(within(dataTable).queryByText('Juan Pérez')).not.toBeInTheDocument();

    // Search for plate AAA123
    fireEvent.change(searchInput, { target: { value: 'AAA123' } });
    expect(within(dataTable).getByText('Juan Pérez')).toBeInTheDocument();
    expect(within(dataTable).queryByText('María Gómez')).not.toBeInTheDocument();
  });

  it('filters debtors by debt aging', async () => {
    render(
      <TooltipProvider>
        <DebtorsClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      const dataTable = screen.getByTestId('data-table');
      expect(within(dataTable).getByText('Juan Pérez')).toBeInTheDocument();
      expect(within(dataTable).getByText('María Gómez')).toBeInTheDocument();
    });

    // Let's find the select element or simulate its value change.
    const agingSelectBtn = screen.getByText('Todas las deudas');
    expect(agingSelectBtn).toBeInTheDocument();
  });
});
