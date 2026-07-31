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
    createdAt: new Date().toISOString(),
    isFullyPaid: false,
    totalPaid: 0,
    workOrderItems: [],
  },
  {
    id: "wo_2",
    status: "CANCELLED",
    customer: { name: "Maria Gomez", phone: "55667788" },
    vehicle: {
      identifier: "BBB222",
      category: "SUV",
      vehicleMake: { name: "Toyota" },
      vehicleModel: { name: "Hilux" },
    },
    total: 35000,
    createdAt: new Date().toISOString(),
    isFullyPaid: false,
    totalPaid: 0,
    workOrderItems: [],
  }
];

const mockTechnicians = [
  { id: "tech_1", name: "Carlos" },
  { id: "tech_2", name: "Alberto" }
];

describe('WorkOrdersPage - Interactive List View Controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn((url: string) => {
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
    });
  });

  it('renders the interactive status and technician controls on List View rows', async () => {
    render(
      <TooltipProvider>
        <WorkOrdersPage />
      </TooltipProvider>
    );

    // Wait for work orders to load
    await waitFor(() => {
      expect(screen.getByText("AAA111")).toBeInTheDocument();
    });

    // Switch to List View
    const listButton = screen.getByText("Lista");
    fireEvent.click(listButton);

    // AAA111 is for CONFIRMED/active work order wo_1
    // BBB222 is for CANCELLED work order wo_2

    // Check Technician selector on the active row
    const assignedText = screen.getAllByText("Sin asignar");
    expect(assignedText.length).toBeGreaterThan(0);

    // Check Status selector on the active row (it has visual text 'Confirmada' inside button)
    expect(screen.getByText("Confirmada")).toBeInTheDocument();
    expect(screen.getByText("Cancelada")).toBeInTheDocument();
  });

  it('stops event propagation on clicking technician and status trigger buttons to prevent Link navigation', async () => {
    render(
      <TooltipProvider>
        <WorkOrdersPage />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("AAA111")).toBeInTheDocument();
    });

    // Switch to List View
    const listButton = screen.getByText("Lista");
    fireEvent.click(listButton);

    // Find the technician trigger button ("Sin asignar" or "Carlos")
    const techTrigger = screen.getAllByText("Sin asignar")[0];
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const spyPropagation = vi.spyOn(clickEvent, 'stopPropagation');

    fireEvent(techTrigger, clickEvent);

    // Verify propagation was stopped so it doesn't trigger parent link
    expect(spyPropagation).toHaveBeenCalled();
  });

  it('disables controls for CANCELLED work orders (terminal state guard compliance)', async () => {
    render(
      <TooltipProvider>
        <WorkOrdersPage />
      </TooltipProvider>
    );

    // First wait for AAA111 to load (which is visible in Kanban column)
    await waitFor(() => {
      expect(screen.getByText("AAA111")).toBeInTheDocument();
    });

    // Switch to List View (which renders cancelled work orders like BBB222)
    const listButton = screen.getByText("Lista");
    fireEvent.click(listButton);

    // Wait for BBB222 to appear on the list
    await waitFor(() => {
      expect(screen.getByText("BBB222")).toBeInTheDocument();
    });

    // Find the Cancelled row element for status
    const cancelledStatusBtn = screen.getByText("Cancelada").closest('button');
    expect(cancelledStatusBtn).toHaveClass('cursor-not-allowed');
    expect(cancelledStatusBtn).toHaveClass('opacity-60');
  });
});
