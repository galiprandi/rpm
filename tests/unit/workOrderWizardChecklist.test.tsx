import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import NewWorkOrderPage from '../../app/adm/work-orders/new/page';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DEFAULT_ENTRY_CHECKLIST } from '@/lib/constants/work-order';

// Mock useRouter, useParams, useSearchParams
vi.mock('next/navigation', () => ({
  useParams: () => ({}),
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/adm/work-orders/new',
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === 'vehicleId') return 'veh_123';
      return null;
    },
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

// Mock ProductServiceSelector
vi.mock("@/components/ui/ProductServiceSelector", () => ({
  ProductServiceSelector: ({ onSelectionChange }: any) => {
    return (
      <div data-testid="product-service-selector">
        <button onClick={() => onSelectionChange([{
          id: 'prod_1',
          type: 'product',
          name: 'Mock Product',
          isManualName: false,
          quantity: 1,
          unitPrice: 1000,
          originalPrice: 1000,
          isManualPrice: false,
        }])}>Select Items</button>
      </div>
    );
  },
}));

// Mock QuickServiceDialog
vi.mock("@/components/work-orders/QuickServiceDialog", () => ({
  QuickServiceDialog: () => <div data-testid="quick-service-dialog">Quick Service Dialog</div>,
}));

// Mock VehicleDialog
vi.mock("@/components/vehicles/VehicleDialog", () => ({
  VehicleDialog: () => <div data-testid="vehicle-dialog">Vehicle Dialog</div>,
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

const mockVehicleDetails = {
  id: "veh_123",
  identifier: "AAA111",
  category: "CAR",
  vehicleMake: { name: "Ford" },
  vehicleModel: { name: "Fiesta" },
  customer: {
    id: "cust_123",
    name: "Juan Perez",
    phone: "11223344",
  },
};

describe('NewWorkOrderPage - Dynamic Checklist and Custom Items', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock local storage
    let store: Record<string, string> = {};
    vi.spyOn(localStorage, 'getItem').mockImplementation((key) => store[key] || null);
    vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });
    vi.spyOn(localStorage, 'removeItem').mockImplementation((key) => {
      delete store[key];
    });
    vi.spyOn(localStorage, 'clear').mockImplementation(() => {
      store = {};
    });

    // Mock ResizeObserver for jsdom
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    global.ResizeObserver = ResizeObserverMock as any;

    global.fetch = vi.fn((input: any) => {
      const url = typeof input === 'string' ? input : (input as any).url || '';
      if (url.includes("/api/vehicles/veh_123")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockVehicleDetails),
        } as any);
      }
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
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as any);
    }) as any;
  });

  const advanceToStep3 = async () => {
    render(
      <TooltipProvider>
        <NewWorkOrderPage />
      </TooltipProvider>
    );

    // Wait for Step 1 vehicle fetch
    await waitFor(() => {
      expect(screen.getByText("Vehículo encontrado")).toBeInTheDocument();
    });

    // Step 1: Click "Confirmar y Continuar"
    const confirmButton = screen.getByText("Confirmar y Continuar");
    fireEvent.click(confirmButton);

    // Step 2: Set some mock items (by triggering SelectionChange with mock product)
    const selectItemsButton = screen.getByText("Select Items");
    fireEvent.click(selectItemsButton);

    // Step 2: Click "Siguiente"
    const nextButton = screen.getByText("Siguiente");
    fireEvent.click(nextButton);

    // Step 3 should now be rendered
    await waitFor(() => {
      expect(screen.getByText("Checklist de Ingreso")).toBeInTheDocument();
    });
  };

  it('renders standard checklist items in Step 3', async () => {
    await advanceToStep3();

    // Check that standard items from DEFAULT_ENTRY_CHECKLIST are rendered
    DEFAULT_ENTRY_CHECKLIST.forEach((item) => {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    });
  });

  it('allows dynamic toggling and bulk checking/unchecking', async () => {
    await advanceToStep3();

    // Initially, bulk button should say "Marcar todos como OK"
    const bulkButton = screen.getByText("Marcar todos como OK");
    expect(bulkButton).toBeInTheDocument();

    // Click "Marcar todos como OK"
    fireEvent.click(bulkButton);

    // The bulk button should toggle its label to "Desmarcar todos"
    await waitFor(() => {
      expect(screen.getByText("Desmarcar todos")).toBeInTheDocument();
    });

    // Clicking "Desmarcar todos" should revert
    fireEvent.click(screen.getByText("Desmarcar todos"));
    await waitFor(() => {
      expect(screen.getByText("Marcar todos como OK")).toBeInTheDocument();
    });
  });

  it('allows adding and removing custom checklist items inline', async () => {
    await advanceToStep3();

    // Input custom checklist item name
    const customInput = screen.getByPlaceholderText("Agregar ítem personalizado... (ej: Casco en baúl)");
    fireEvent.change(customInput, { target: { value: "Verificar extintor" } });

    // Click "Agregar"
    const addButton = screen.getByText("Agregar");
    fireEvent.click(addButton);

    // Verify it is displayed
    await waitFor(() => {
      expect(screen.getByText("Verificar extintor")).toBeInTheDocument();
    });

    // Check that custom item has an inline delete button (Lucide X icon)
    const deleteButtons = screen.getAllByRole("button").filter(
      (btn) => btn.getAttribute("title") === "Eliminar ítem personalizado"
    );
    expect(deleteButtons.length).toBe(1);

    // Click delete button
    fireEvent.click(deleteButtons[0]);

    // Verify it is removed
    await waitFor(() => {
      expect(screen.queryByText("Verificar extintor")).not.toBeInTheDocument();
    });
  });

  it('robustly loads and migrates legacy Record-based checklists from localStorage', async () => {
    // Set a legacy Record<string, boolean> checklist in localStorage
    const legacyState = {
      step: 3,
      checklist: {
        exterior_clean: true,
        lights: true,
      },
      odometerValue: "15000",
      fuelLevel: 75,
      notes: "Test notes",
      items: [],
      foundVehicle: mockVehicleDetails,
    };
    localStorage.setItem("work-order-wizard-state", JSON.stringify(legacyState));

    render(
      <TooltipProvider>
        <NewWorkOrderPage />
      </TooltipProvider>
    );

    // Wait for rendering
    await waitFor(() => {
      expect(screen.getByText("Checklist de Ingreso")).toBeInTheDocument();
    });

    // Check that exterior_clean and lights checkboxes are checked, others unchecked
    const exteriorCheckbox = screen.getByLabelText("Limpieza exterior") as HTMLInputElement;
    const lightsCheckbox = screen.getByLabelText("Funcionamiento de luces") as HTMLInputElement;
    const fluidsCheckbox = screen.getByLabelText("Niveles de fluidos") as HTMLInputElement;

    expect(exteriorCheckbox.checked).toBe(true);
    expect(lightsCheckbox.checked).toBe(true);
    expect(fluidsCheckbox.checked).toBe(false);
  });
});
