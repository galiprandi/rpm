import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import NewWorkOrderPage from '../../app/adm/work-orders/new/page';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';

// Mock next/navigation
vi.mock('next/navigation', () => {
  const pushMock = vi.fn();
  return {
    useRouter: () => ({
      push: pushMock,
      back: vi.fn(),
    }),
    useSearchParams: () => ({
      get: vi.fn((key) => null),
    }),
  };
});

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

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useUI
vi.mock('@/components/ui/UIProvider', () => ({
  useUI: () => ({
    alert: vi.fn(),
    confirm: vi.fn().mockResolvedValue(true),
  }),
}));

const mockPastWorkOrders = [
  {
    id: "past_wo_123",
    status: "DELIVERED",
    customer: { id: "cust-1", name: "Juan Perez", phone: "11223344" },
    vehicle: {
      id: "v-123",
      identifier: "AAA111",
      category: "CAR",
      vehicleMake: { name: "Ford" },
      vehicleModel: { name: "Fiesta" },
    },
    total: 25000,
    createdAt: "2026-08-01T12:00:00.000Z",
    isFullyPaid: true,
    notes: "Tiene detalles de pintura y se cambiaron bujías",
    entryChecklist: { check_lights: true },
    exitChecklist: { check_quality: true },
    workOrderItems: [
      {
        type: "PRODUCT",
        productId: "prod-1",
        name: "Aceite Sintético 5W30",
        quantity: 1,
        unitPrice: 15000,
      },
      {
        type: "SERVICE",
        serviceId: "srv-2",
        name: "Cambio de Filtros y Aceite",
        quantity: 1,
        unitPrice: 10000,
      }
    ],
  }
];

describe('NewWorkOrderPage - Vehicle History Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(localStorage.getItem).mockReturnValue(null);

    global.fetch = vi.fn((input: any) => {
      const url = typeof input === 'string' ? input : (input as any).url || '';

      if (url.includes("/api/price-lists")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ priceLists: [] }),
        } as any);
      }

      if (url.includes("/api/settings")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ settings: [] }),
        } as any);
      }

      if (url.includes("/api/users")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: [] }),
        } as any);
      }

      if (url.includes("/api/vehicles/by-identifier")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            vehicles: [
              {
                id: "v-123",
                identifier: "AAA111",
                category: "CAR",
                customer: { id: "cust-1", name: "Juan Perez", phone: "11223344" },
                vehicleMake: { name: "Ford" },
                vehicleModel: { name: "Fiesta" },
              }
            ]
          }),
        } as any);
      }

      if (url.includes("/api/work-orders")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ workOrders: mockPastWorkOrders }),
        } as any);
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as any);
    }) as any;
  });

  it('renders correctly and searches for vehicle and displays its history', async () => {
    render(
      <TooltipProvider>
        <NewWorkOrderPage />
      </TooltipProvider>
    );

    // Wait for page load
    const input = await screen.findByPlaceholderText("Ej: ABC123, AB123CD o N° de serie");
    expect(input).toBeInTheDocument();

    // Type license plate
    fireEvent.change(input, { target: { value: 'AAA111' } });

    const searchBtn = screen.getByRole("button", { name: "Buscar vehículo" });
    fireEvent.click(searchBtn);

    // Should load foundVehicle and trigger fetch for its history
    await waitFor(() => {
      expect(screen.getByText(/Vehículo encontrado/i)).toBeInTheDocument();
      expect(screen.getByText(/Historial Reciente de Servicios/i)).toBeInTheDocument();
      expect(screen.getByText(/OT-PAST_WO_/i)).toBeInTheDocument();
      expect(screen.getByText(/Aceite Sintético 5W30/i)).toBeInTheDocument();
    });
  });

  it('allows duplicating past work order items with confirm warning if existing items are present', async () => {
    render(
      <TooltipProvider>
        <NewWorkOrderPage />
      </TooltipProvider>
    );

    // Wait for page load
    const input = await screen.findByPlaceholderText("Ej: ABC123, AB123CD o N° de serie");
    expect(input).toBeInTheDocument();

    // Type license plate
    fireEvent.change(input, { target: { value: 'AAA111' } });

    const searchBtn = screen.getByRole("button", { name: "Buscar vehículo" });
    fireEvent.click(searchBtn);

    // Wait for history to render
    await waitFor(() => {
      expect(screen.getByText(/Cargar ítems/i)).toBeInTheDocument();
    });

    // Click "Cargar ítems"
    const loadItemsBtn = screen.getByText(/Cargar ítems/i);
    fireEvent.click(loadItemsBtn);

    // Since items list was empty, it should load items and switch to Step 2 immediately
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Se cargaron los ítems de la orden de trabajo anterior");
      expect(screen.getByText(/Cambiar/i)).toBeInTheDocument(); // step 2 header button
    });
  });
});
