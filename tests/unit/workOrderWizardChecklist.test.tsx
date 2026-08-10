import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

// Mock ResizeObserver for JSDOM before component imports
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock as any;

import NewWorkOrderPage from "../../app/adm/work-orders/new/page";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock useParams, useRouter and next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/adm/work-orders/new",
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

// Mock UIProvider
vi.mock("@/components/ui/UIProvider", () => ({
  useUI: () => ({
    alert: vi.fn(),
    confirm: vi.fn(),
  }),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

describe("NewWorkOrderPage - Dynamic Checklist & Custom Items", () => {
  let localStorageStore: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageStore = {};

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key) => localStorageStore[key] || null),
        setItem: vi.fn((key, value) => {
          localStorageStore[key] = value.toString();
        }),
        removeItem: vi.fn((key) => {
          delete localStorageStore[key];
        }),
        clear: vi.fn(() => {
          localStorageStore = {};
        }),
      },
      writable: true,
    });

    // Mock global fetch
    global.fetch = vi.fn((input: any) => {
      const url = typeof input === "string" ? input : (input as any).url || "";
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

  const loadStep3State = (checklistData?: any) => {
    const state = {
      step: 3,
      checklist: checklistData !== undefined ? checklistData : [
        { id: "exterior_clean", label: "Limpieza exterior", checked: false },
        { id: "interior_clean", label: "Limpieza interior", checked: true },
      ],
      odometerValue: "12345",
      fuelLevel: 75,
      notes: "Test notes",
      scheduledDate: "",
      items: [
        { type: "SERVICE", serviceId: "srv_1", name: "Servicio Test", quantity: 1, unitPrice: 1000 },
      ],
      foundVehicle: {
        id: "veh_1",
        identifier: "AAA111",
        category: "CAR",
        customer: { id: "cust_1", name: "Juan Perez", phone: "112233" },
      },
    };
    window.localStorage.setItem("work-order-wizard-state", JSON.stringify(state));
  };

  it("should load pre-existing ChecklistItem array from state", async () => {
    loadStep3State();

    render(
      <TooltipProvider>
        <NewWorkOrderPage />
      </TooltipProvider>
    );

    // Wait for the component to load state and show Step 3
    await waitFor(() => {
      expect(screen.getByText("Checklist de Ingreso")).toBeInTheDocument();
    });

    // Check pre-loaded checked/unchecked item states
    const interiorCleanCheckbox = screen.getByLabelText("Limpieza interior") as HTMLInputElement;
    const exteriorCleanCheckbox = screen.getByLabelText("Limpieza exterior") as HTMLInputElement;

    expect(interiorCleanCheckbox.checked).toBe(true);
    expect(exteriorCleanCheckbox.checked).toBe(false);
  });

  it("should robustly migrate legacy Record<string, boolean> checklist to array", async () => {
    loadStep3State({
      exterior_clean: true,
      fluids: true,
      lights: false,
    });

    render(
      <TooltipProvider>
        <NewWorkOrderPage />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Checklist de Ingreso")).toBeInTheDocument();
    });

    const exteriorCleanCheckbox = screen.getByLabelText("Limpieza exterior") as HTMLInputElement;
    const fluidsCheckbox = screen.getByLabelText("Niveles de fluidos") as HTMLInputElement;
    const lightsCheckbox = screen.getByLabelText("Funcionamiento de luces") as HTMLInputElement;

    expect(exteriorCleanCheckbox.checked).toBe(true);
    expect(fluidsCheckbox.checked).toBe(true);
    expect(lightsCheckbox.checked).toBe(false);
  });

  it("should support toggling item checklist checkboxes", async () => {
    loadStep3State();

    render(
      <TooltipProvider>
        <NewWorkOrderPage />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Checklist de Ingreso")).toBeInTheDocument();
    });

    const exteriorCleanCheckbox = screen.getByLabelText("Limpieza exterior") as HTMLInputElement;
    expect(exteriorCleanCheckbox.checked).toBe(false);

    // Toggle checked
    fireEvent.click(exteriorCleanCheckbox);
    expect(exteriorCleanCheckbox.checked).toBe(true);

    // Toggle back to unchecked
    fireEvent.click(exteriorCleanCheckbox);
    expect(exteriorCleanCheckbox.checked).toBe(false);
  });

  it("should handle bulk toggling with 'Marcar todos como OK' and 'Desmarcar todos'", async () => {
    loadStep3State();

    render(
      <TooltipProvider>
        <NewWorkOrderPage />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Checklist de Ingreso")).toBeInTheDocument();
    });

    const bulkButton = screen.getByRole("button", { name: "Marcar todos como OK" });
    const interiorCleanCheckbox = screen.getByLabelText("Limpieza interior") as HTMLInputElement;
    const exteriorCleanCheckbox = screen.getByLabelText("Limpieza exterior") as HTMLInputElement;

    expect(bulkButton).toBeInTheDocument();
    expect(exteriorCleanCheckbox.checked).toBe(false);

    // Bulk toggle OK
    fireEvent.click(bulkButton);

    expect(interiorCleanCheckbox.checked).toBe(true);
    expect(exteriorCleanCheckbox.checked).toBe(true);

    // Bulk button label should change to "Desmarcar todos"
    const bulkButtonUncheck = screen.getByRole("button", { name: "Desmarcar todos" });
    expect(bulkButtonUncheck).toBeInTheDocument();

    // Bulk toggle off
    fireEvent.click(bulkButtonUncheck);

    expect(interiorCleanCheckbox.checked).toBe(false);
    expect(exteriorCleanCheckbox.checked).toBe(false);
  });

  it("should support adding dynamic custom items and deleting them inline", async () => {
    loadStep3State();

    render(
      <TooltipProvider>
        <NewWorkOrderPage />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Checklist de Ingreso")).toBeInTheDocument();
    });

    const customInput = screen.getByPlaceholderText("Agregar ítem personalizado... (ej: Casco en baúl)");
    const addButton = screen.getByRole("button", { name: "Agregar" });

    // Add custom item
    fireEvent.change(customInput, { target: { value: "Matafuego cargado" } });
    fireEvent.click(addButton);

    // Verify custom item is added
    await waitFor(() => {
      expect(screen.getByText("Matafuego cargado")).toBeInTheDocument();
    });

    const customCheckbox = screen.getByLabelText("Matafuego cargado") as HTMLInputElement;
    expect(customCheckbox.checked).toBe(false);

    // Toggle custom item
    fireEvent.click(customCheckbox);
    expect(customCheckbox.checked).toBe(true);

    // Delete custom item
    const deleteButton = screen.getByTitle("Eliminar ítem personalizado");
    fireEvent.click(deleteButton);

    // Verify custom item is deleted
    expect(screen.queryByText("Matafuego cargado")).not.toBeInTheDocument();
  });
});
