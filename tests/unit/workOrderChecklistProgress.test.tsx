import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import WorkOrderDetailPage from '../../app/adm/work-orders/[id]/page';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock useParams, useRouter and next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'wo_1' }),
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/adm/work-orders/wo_1',
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock authClient
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: { id: "tech_1", name: "Carlos", email: "carlos@tech.com" },
      },
    }),
  },
}));

// Mock tabs component to render all contents immediately under Testing Library
vi.mock("@/components/ui/tabs", () => {
  return {
    Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
    TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
    TabsTrigger: ({ children }: any) => <button>{children}</button>,
    TabsContent: ({ children }: any) => <div data-testid="tabs-content">{children}</div>,
  };
});

// Mock dropdown-menu to avoid complexity in test
vi.mock("@/components/ui/dropdown-menu", () => {
  return {
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuPortal: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children, asChild, ...props }: any) => {
      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as any, props);
      }
      return <div data-testid="dropdown-trigger" {...props}>{children}</div>;
    },
    DropdownMenuContent: ({ children, ...props }: any) => <div data-testid="dropdown-content" {...props}>{children}</div>,
    DropdownMenuItem: ({ children, onClick, ...props }: any) => (
      <div onClick={onClick} role="menuitem" {...props}>{children}</div>
    ),
    DropdownMenuLabel: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    DropdownMenuSeparator: () => <hr />,
  };
});

// Mock credit note dialog
vi.mock("@/components/credit-notes/CustomerCreditNoteDialog", () => ({
  CustomerCreditNoteDialog: () => <div data-testid="credit-note-dialog">Credit Note Dialog</div>,
}));

// Mock UIProvider
vi.mock('@/components/ui/UIProvider', () => ({
  useUI: () => ({
    alert: vi.fn(),
    confirm: vi.fn(),
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

const mockWorkOrderDetails = {
  id: "wo_1",
  status: "CONFIRMED",
  customer: {
    id: "cust_123",
    name: "Juan Perez",
    phone: "11223344",
  },
  vehicle: {
    id: "veh_123",
    identifier: "AAA111",
    category: "CAR",
    vehicleMake: { name: "Ford" },
    vehicleModel: { name: "Fiesta" },
  },
  workOrderItems: [
    {
      id: "item_1",
      type: "SERVICE",
      name: "Cambio de Aceite",
      isManualName: false,
      quantity: 1,
      unitPrice: 5000,
      subtotal: 5000,
    }
  ],
  entryChecklist: {
    items: [
      { id: "luces", label: "Luces delanteras", checked: true },
      { id: "frenos", label: "Líquido de frenos", checked: false },
    ],
    completedAt: new Date().toISOString(),
  },
  exitChecklist: {
    items: [
      { id: "limpieza", label: "Limpieza general", checked: true },
    ],
    completedAt: new Date().toISOString(),
  },
  entryPhotos: [],
  exitPhotos: [],
  total: 5000,
  totalProducts: 0,
  totalServices: 5000,
  notes: "Revisar ruidos molestos",
  createdAt: new Date().toISOString(),
};

describe('WorkOrderDetailPage - Checklist Progress and Custom Items', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock ResizeObserver for jsdom
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    global.ResizeObserver = ResizeObserverMock as any;

    global.fetch = vi.fn((input: any) => {
      const url = typeof input === 'string' ? input : (input as any).url || '';
      if (url.includes("/api/work-orders/wo_1/payments")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ payments: [], totalPaid: 0 }),
        } as any);
      }
      if (url.includes("/api/work-orders/wo_1/audit-logs")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as any);
      }
      if (url.includes("/api/work-orders/wo_1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockWorkOrderDetails),
        } as any);
      }
      if (url.includes("/api/invoices")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as any);
      }
      if (url.includes("/api/price-lists")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ priceLists: [] }),
        } as any);
      }
      if (url.includes("/api/users")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: [] }),
        } as any);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as any);
    }) as any;
  });

  it('renders the checklist progress stats and visual progress bar', async () => {
    render(
      <TooltipProvider>
        <WorkOrderDetailPage />
      </TooltipProvider>
    );

    // Wait for the work order to load
    await waitFor(() => {
      expect(screen.getAllByText("Progreso de Inspección")[0]).toBeInTheDocument();
    });

    // Check entry checklist progress label: 1/2 OK (50%)
    expect(screen.getByText("1/2 OK (50%)")).toBeInTheDocument();

    // Check exit checklist progress label: 1/1 OK (100%)
    expect(screen.getByText("1/1 OK (100%)")).toBeInTheDocument();
  });

  it('allows adding a custom checklist item and displays it in edit mode', async () => {
    render(
      <TooltipProvider>
        <WorkOrderDetailPage />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("Progreso de Inspección")[0]).toBeInTheDocument();
    });

    // Click "Editar" on the Entry Checklist
    const editButton = screen.getByTestId("edit-entry-checklist");
    fireEvent.click(editButton);

    // Input text for custom item
    const customInput = screen.getByPlaceholderText("Agregar ítem personalizado... (ej: Casco en baúl)");
    fireEvent.change(customInput, { target: { value: "Llaves duplicadas" } });

    // Click "Agregar"
    const addButton = screen.getByText("Agregar");
    fireEvent.click(addButton);

    // Check that the new item is listed in the items
    expect(screen.getByText("Llaves duplicadas")).toBeInTheDocument();

    // Verify progress stats updated to 1/3 OK (33%)
    expect(screen.getByText("1/3 OK (33%)")).toBeInTheDocument();
  });
});
