import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import WorkOrdersPage from '../../app/adm/work-orders/page';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock useRouter and next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/adm/work-orders',
}));

// Mock useUser
vi.mock("@/components/ui/UserProvider", () => ({
  useUser: () => ({
    id: "tech_1",
    name: "Carlos",
    email: "carlos@tech.com",
    role: "ADMIN",
    permissions: ["*"],
    can: () => true,
    isAdmin: true,
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

// Mock dropdown-menu to render inline under testing library
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

// Mock useIsMobile
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the UIProvider/useUI
vi.mock('@/components/ui/UIProvider', () => ({
  useUI: () => ({
    alert: vi.fn(),
    confirm: vi.fn(),
  }),
}));

const mockWorkOrders = [
  {
    id: "wo_1",
    status: "CONFIRMED",
    customer: { name: "Juan Perez", phone: "11223344" },
    vehicle: {
      identifier: "AAA111",
      category: "CAR",
      vehicleMake: { name: "Ford" },
      vehicleModel: { name: "Fiesta" },
    },
    total: 15000,
    technicianId: "tech_1",
    technician: { id: "tech_1", name: "Carlos" },
    createdAt: new Date().toISOString(),
    isFullyPaid: false,
    totalPaid: 0,
    workOrderItems: [],
  },
  {
    id: "wo_2",
    status: "CONFIRMED",
    customer: { name: "Maria Gomez", phone: "55667788" },
    vehicle: {
      identifier: "BBB222",
      category: "SUV",
      vehicleMake: { name: "Toyota" },
      vehicleModel: { name: "Hilux" },
    },
    total: 35000,
    technicianId: "tech_2",
    technician: { id: "tech_2", name: "Alberto" },
    createdAt: new Date().toISOString(),
    isFullyPaid: false,
    totalPaid: 0,
    workOrderItems: [],
  },
  {
    id: "wo_3",
    status: "CONFIRMED",
    customer: { name: "Carlos Sanchez", phone: "99887766" },
    vehicle: {
      identifier: "CCC333",
      category: "TRUCK",
      vehicleMake: { name: "Scania" },
      vehicleModel: { name: "R450" },
    },
    total: 85000,
    technicianId: null,
    createdAt: new Date().toISOString(),
    isFullyPaid: true,
    totalPaid: 85000,
    workOrderItems: [],
  }
];

const mockTechnicians = [
  { id: "tech_1", name: "Carlos" },
  { id: "tech_2", name: "Alberto" }
];

describe('WorkOrdersPage - "Mis OTs" Filter Option', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn((input: any) => {
      const url = typeof input === 'string' ? input : (input as any).url || '';
      if (url.includes("/api/work-orders")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ workOrders: mockWorkOrders }),
        } as any);
      }
      if (url.includes("/api/users")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: mockTechnicians }),
        } as any);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as any);
    }) as any;
  });

  it('renders "Mis OTs" button on the toolbar with the correct user assigned count badge', async () => {
    render(
      <TooltipProvider>
        <WorkOrdersPage />
      </TooltipProvider>
    );

    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByText("AAA111")).toBeInTheDocument();
    });

    // Check that "Mis OTs" button is present and contains the count '1'
    const myOrdersButton = screen.getByRole("button", { name: /Mis OTs/i });
    expect(myOrdersButton).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // Carlos has exactly 1 work order (wo_1)
  });

  it('filters the displayed work orders to only show those assigned to the current user when clicked', async () => {
    render(
      <TooltipProvider>
        <WorkOrdersPage />
      </TooltipProvider>
    );

    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByText("AAA111")).toBeInTheDocument();
    });

    // Switch to List view to easily check all items
    const listButton = screen.getByText("Lista");
    fireEvent.click(listButton);

    // Initially, all three work orders (AAA111, BBB222, CCC333) are visible
    expect(screen.getByText("AAA111")).toBeInTheDocument();
    expect(screen.getByText("BBB222")).toBeInTheDocument();
    expect(screen.getByText("CCC333")).toBeInTheDocument();

    // Click "Mis OTs" button to filter
    const myOrdersButton = screen.getByRole("button", { name: /Mis OTs/i });
    fireEvent.click(myOrdersButton);

    // Now, only AAA111 (assigned to tech_1 - Carlos) should be displayed
    await waitFor(() => {
      expect(screen.getByText("AAA111")).toBeInTheDocument();
      expect(screen.queryByText("BBB222")).not.toBeInTheDocument();
      expect(screen.queryByText("CCC333")).not.toBeInTheDocument();
    });

    // Click "Mis OTs" button again to turn off the filter
    fireEvent.click(myOrdersButton);

    // All three work orders should be visible again
    await waitFor(() => {
      expect(screen.getByText("AAA111")).toBeInTheDocument();
      expect(screen.getByText("BBB222")).toBeInTheDocument();
      expect(screen.getByText("CCC333")).toBeInTheDocument();
    });
  });

  it('resets the "Mis OTs" filter when clear all filters action is clicked', async () => {
    render(
      <TooltipProvider>
        <WorkOrdersPage />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("AAA111")).toBeInTheDocument();
    });

    // Switch to List view
    const listButton = screen.getByText("Lista");
    fireEvent.click(listButton);

    // Click "Mis OTs" button to filter
    const myOrdersButton = screen.getByRole("button", { name: /Mis OTs/i });
    fireEvent.click(myOrdersButton);

    // Expect AAA111 is visible and BBB222 is filtered
    expect(screen.getByText("AAA111")).toBeInTheDocument();
    expect(screen.queryByText("BBB222")).not.toBeInTheDocument();

    // The "Limpiar filtros" text button should be visible in toolbar
    const clearFiltersButton = screen.getByRole("button", { name: /Limpiar filtros/i });
    expect(clearFiltersButton).toBeInTheDocument();

    // Click "Limpiar filtros"
    fireEvent.click(clearFiltersButton);

    // Both should be visible now
    await waitFor(() => {
      expect(screen.getByText("AAA111")).toBeInTheDocument();
      expect(screen.getByText("BBB222")).toBeInTheDocument();
    });
  });
});
