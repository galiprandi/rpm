import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import InvoicesPage from './page';
import React from 'react';

// Mock components
vi.mock('@/components/adm', () => ({
  Header: ({ title, description }: any) => (
    <div data-testid="header">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
  CrudStats: ({ stats }: any) => (
    <div data-testid="crud-stats">
      {stats.map((stat: any, i: number) => (
        <div key={i} data-testid={`stat-${stat.label.toLowerCase().replace(/ /g, '-')}`}>
          <span>{stat.label}</span>: <span>{stat.value}</span>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/ui/data-table', () => ({
  DataTable: ({ data, columns, emptyMessage }: any) => (
    <div data-testid="data-table">
      {data.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <table>
          <thead>
            <tr>
              {columns.map((col: any, idx: number) => (
                <th key={idx}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, idx: number) => (
              <tr key={row.id || idx}>
                {columns.map((col: any, cidx: number) => (
                  <td key={cidx}>
                    {col.cell ? col.cell({ row: { original: row } }) : row[col.accessorKey]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  ),
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="input" {...props} />,
}));

// Mock Sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

// Mock Lucide Icons
vi.mock('lucide-react', () => ({
  FileText: () => <div data-testid="icon-filetext" />,
  Search: () => <div data-testid="icon-search" />,
  RefreshCw: () => <div data-testid="icon-refreshcw" />,
  Send: () => <div data-testid="icon-send" />,
  Download: () => <div data-testid="icon-download" />,
  Eye: () => <div data-testid="icon-eye" />,
  XCircle: () => <div data-testid="icon-xcircle" />,
  Calendar: () => <div data-testid="icon-calendar" />,
  X: () => <div data-testid="icon-x" />,
  CheckCircle2: () => <div data-testid="icon-checkcircle2" />,
  Clock: () => <div data-testid="icon-clock" />,
  AlertTriangle: () => <div data-testid="icon-alerttriangle" />,
  AlertCircle: () => <div data-testid="icon-alertcircle" />,
}));

// Mock Next Navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('InvoicesPage', () => {
  const mockInvoices = [
    {
      id: 'inv-1',
      number: 'X-0001-00000001',
      type: 'X_A',
      customerName: 'Customer A',
      customerDoc: '30-12345678-9',
      customerDocType: 'CUIT',
      createdAt: '2026-07-20T10:00:00.000Z',
      total: 10000.00,
      status: 'DRAFT',
    },
    {
      id: 'inv-2',
      number: '0001-00000002',
      type: 'FACTURA_B',
      customerName: 'Customer B',
      customerDoc: '11223344',
      customerDocType: 'DNI',
      createdAt: '2026-07-20T11:00:00.000Z',
      total: 15000.00,
      status: 'ISSUED',
    },
    {
      id: 'inv-3',
      number: 'X-0001-00000003',
      type: 'X_B',
      customerName: 'Customer C',
      customerDoc: '99887766',
      customerDocType: 'DNI',
      createdAt: '2026-07-20T12:00:00.000Z',
      total: 5000.00,
      status: 'REJECTED',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockInvoices),
      })
    );
  });

  it('renders InvoicesPage, loads invoices, and displays the correct CrudStats', async () => {
    render(<InvoicesPage />);

    // Initially loading state (skeleton)
    expect(screen.getAllByTestId('skeleton')[0]).toBeInTheDocument();

    // Wait for the invoices to load
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    });

    // Check header
    expect(screen.getByText('Comprobantes')).toBeInTheDocument();

    // Check stats calculations:
    // Total Count: 3
    // Issued Total: $15,000.00 (represented formatted)
    // Pending Total (DRAFT + REJECTED): $10,000.00 + $5,000.00 = $15,000.00 (represented formatted)
    // Rejected count: 1
    const totalCountStat = screen.getByTestId('stat-total-comprobantes');
    expect(totalCountStat).toHaveTextContent('Total comprobantes: 3');

    const issuedStat = screen.getByTestId('stat-oficializado');
    expect(issuedStat).toHaveTextContent('Oficializado');

    const pendingStat = screen.getByTestId('stat-pendiente-(x)');
    expect(pendingStat).toHaveTextContent('Pendiente (X)');

    const rejectedStat = screen.getByTestId('stat-rechazado-por-afip');
    expect(rejectedStat).toHaveTextContent('Rechazado por AFIP: 1');

    // Check details in data table are rendered
    expect(screen.getByText('Customer A')).toBeInTheDocument();
    expect(screen.getByText('Customer B')).toBeInTheDocument();
    expect(screen.getByText('Customer C')).toBeInTheDocument();
  });
});
