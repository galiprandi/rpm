import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import React from "react";
import VehiclesClient from "./VehiclesClient";
import { TooltipProvider } from "@/components/ui/tooltip";

const mockAlert = vi.fn();
// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

// Mock useUI
vi.mock("@/components/ui/UIProvider", () => ({
  useUI: () => ({
    alert: mockAlert,
    confirm: vi.fn(),
  }),
}));

// Mock Select component because standard select interaction under JSDOM
// might get complicated with Radix select.
vi.mock("@/components/ui/select", () => {
  return {
    Select: ({ value, onValueChange }: any) => (
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        data-testid="mock-select"
      >
        <option value="CASH">Efectivo</option>
        <option value="TRANSFER">Transferencia</option>
        <option value="CARD">Tarjeta</option>
        <option value="CHECK">Cheque</option>
      </select>
    ),
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  };
});

// Mock Header and CrudStats
vi.mock("@/components/adm", () => ({
  Header: ({ title, description, secondaryActions, children }: any) => (
    <div data-testid="header">
      <h1>{title}</h1>
      <p>{description}</p>
      {secondaryActions?.map((action: any, idx: number) => (
        <button key={idx} onClick={action.onClick} disabled={action.disabled}>
          {action.label}
        </button>
      ))}
      {children}
    </div>
  ),
  CrudStats: ({ stats }: any) => (
    <div data-testid="stats">
      {stats?.map((stat: any, idx: number) => (
        <div key={idx} data-testid={`stat-${idx}`}>
          <span className="label">{stat.label}</span>: <span className="value">{stat.value}</span>
        </div>
      ))}
    </div>
  ),
  CrudAdmin: ({ items, onExport, onCreate, rowActions }: any) => (
    <div data-testid="crud-admin">
      <button onClick={onExport} data-testid="export-btn">Exportar CSV</button>
      {onCreate && <button onClick={onCreate} data-testid="create-btn">Nuevo Vehículo</button>}
      <ul>
        {items?.map((item: any, idx: number) => {
          // Calculate debt for assertion
          const debt = item.workOrders
            ? item.workOrders
                .filter((wo: any) => wo.status !== "PAID" && wo.status !== "CANCELLED")
                .reduce((sum: number, wo: any) => sum + Number(wo.total), 0)
            : 0;

          return (
            <li key={idx} data-testid={`item-${item.id}`}>
              <span className="id">{item.identifier}</span>
              <span className="owner">{item.customer?.name}</span>
              <span className="debt">{debt}</span>
              {rowActions && <div data-testid={`actions-${item.id}`}>{rowActions(item)}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  ),
}));

vi.mock("@/components/vehicles/VehicleDialog", () => ({
  VehicleDialog: ({ open, onOpenChange }: any) => (
    open ? (
      <div data-testid="vehicle-dialog">
        <span>Mocked Vehicle Dialog</span>
        <button onClick={() => onOpenChange(false)} data-testid="close-dialog-btn">Close Dialog</button>
      </div>
    ) : null
  ),
}));

describe("VehiclesClient", () => {
  const mockVehicles = [
    {
      id: "v-1",
      identifier: "AF719HZ",
      category: "CAR",
      createdAt: "2026-07-21T12:00:00.000Z",
      updatedAt: "2026-07-21T12:00:00.000Z",
      customer: {
        id: "cust-1",
        name: "Juan Pérez",
        phone: "3411234567",
      },
      vehicleMake: { name: "Fiat" },
      vehicleModel: { name: "Cronos" },
      equipmentName: null,
      _count: { workOrders: 1 },
      workOrders: [
        { id: "wo-1", status: "READY", total: 15000 },
      ],
    },
    {
      id: "v-2",
      identifier: "AE123CD",
      category: "CAR",
      createdAt: "2026-07-25T12:00:00.000Z",
      updatedAt: "2026-07-25T12:00:00.000Z",
      customer: {
        id: "cust-2",
        name: "María Gómez",
        phone: "3419876543",
      },
      vehicleMake: { name: "Toyota" },
      vehicleModel: { name: "Hilux" },
      equipmentName: null,
      _count: { workOrders: 2 },
      workOrders: [
        { id: "wo-2", status: "PAID", total: 45000 },
        { id: "wo-3", status: "CANCELLED", total: 30000 },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly and displays vehicles list and stats", () => {
    render(
      <TooltipProvider>
        <VehiclesClient initialVehicles={mockVehicles} totalVehicles={2} />
      </TooltipProvider>
    );

    // Header renders
    expect(screen.getByText("Vehículos y Equipos")).toBeInTheDocument();

    // Stats render correct totals
    // Total: 2, Active Categories: 1 (CAR), Con Deuda: 1 (v-1 has READY wo, v-2 has PAID/CANCELLED)
    expect(screen.getByTestId("stats")).toBeInTheDocument();
    expect(screen.getByText("Total Vehículos")).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(2);
  });

  it("calculates vehicle debt accurately excluding PAID or CANCELLED work orders", () => {
    render(
      <TooltipProvider>
        <VehiclesClient initialVehicles={mockVehicles} totalVehicles={2} />
      </TooltipProvider>
    );

    // v-1 has a READY work order of 15000 -> Debt should be 15000
    const v1 = screen.getByTestId("item-v-1");
    expect(v1.querySelector(".debt")?.textContent).toBe("15000");

    // v-2 has PAID (45000) and CANCELLED (30000) work orders -> Debt should be 0
    const v2 = screen.getByTestId("item-v-2");
    expect(v2.querySelector(".debt")?.textContent).toBe("0");
  });

  it("toggles the 'Filtrar con Deuda' filter and updates the list correctly", async () => {
    render(
      <TooltipProvider>
        <VehiclesClient initialVehicles={mockVehicles} totalVehicles={2} />
      </TooltipProvider>
    );

    // Initially both vehicles are shown
    expect(screen.getAllByRole("listitem").length).toBe(2);

    // Find and click the toggle filter button "Filtrar con Deuda"
    const filterBtn = screen.getByRole("button", { name: /Filtrar con Deuda/i });
    expect(filterBtn).toBeInTheDocument();

    fireEvent.click(filterBtn);

    // Now only v-1 (which has positive debt) should be visible
    expect(screen.getAllByRole("listitem").length).toBe(1);
    expect(screen.getByTestId("item-v-1")).toBeInTheDocument();
    expect(screen.queryByTestId("item-v-2")).not.toBeInTheDocument();

    // Toggles back to "Ver Todos"
    const viewAllBtn = screen.getByRole("button", { name: /Ver Todos/i });
    expect(viewAllBtn).toBeInTheDocument();

    fireEvent.click(viewAllBtn);

    // Both should be visible again
    expect(screen.getAllByRole("listitem").length).toBe(2);
  });

  it("performs client-side CSV export containing calculated debt", () => {
    const createObjectURLMock = vi.fn().mockReturnValue("blob-url");
    global.URL.createObjectURL = createObjectURLMock;

    const clickMock = vi.fn();
    const originalCreateElement = document.createElement;
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      const el = originalCreateElement.call(document, tagName);
      if (tagName === "a") {
        el.click = clickMock;
      }
      return el;
    });

    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(document.body, "removeChild");

    render(
      <TooltipProvider>
        <VehiclesClient initialVehicles={mockVehicles} totalVehicles={2} />
      </TooltipProvider>
    );

    const exportBtn = screen.getByTestId("export-btn");
    expect(exportBtn).toBeInTheDocument();

    fireEvent.click(exportBtn);

    // Verify object URL creation was called
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
  });

  it("opens and closes the VehicleDialog when create action is triggered", async () => {
    render(
      <TooltipProvider>
        <VehiclesClient initialVehicles={mockVehicles} totalVehicles={2} />
      </TooltipProvider>
    );

    // Dialog should not be initially rendered
    expect(screen.queryByTestId("vehicle-dialog")).not.toBeInTheDocument();

    // Click the "Nuevo Vehículo" button to open dialog
    const createBtn = screen.getByTestId("create-btn");
    expect(createBtn).toBeInTheDocument();
    fireEvent.click(createBtn);

    // Dialog should be rendered now
    expect(screen.getByTestId("vehicle-dialog")).toBeInTheDocument();
    expect(screen.getByText("Mocked Vehicle Dialog")).toBeInTheDocument();

    // Click on the close button in the dialog
    const closeBtn = screen.getByTestId("close-dialog-btn");
    fireEvent.click(closeBtn);

    // Dialog should be closed
    expect(screen.queryByTestId("vehicle-dialog")).not.toBeInTheDocument();
  });

  it("opens the payment registration dialog, handles input, and registers a payment successfully", async () => {
    // Mock fetch globally based on URL
    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url.includes("/api/vehicles")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ vehicles: mockVehicles, total: 2 }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });
    global.fetch = mockFetch;

    render(
      <TooltipProvider>
        <VehiclesClient initialVehicles={mockVehicles} totalVehicles={2} />
      </TooltipProvider>
    );

    // v-1 has a ready work order (total 15000), so debt > 0.
    // It should have the ArrowDownLeft button inside its row actions.
    const payBtn = screen.getByRole("button", {
      name: /Registrar pago para vehículo AF719HZ/i,
    });
    expect(payBtn).toBeInTheDocument();

    // Click pay button to open dialog
    fireEvent.click(payBtn);

    // Dialog title should be present
    expect(screen.getByText("Registrar Pago")).toBeInTheDocument();
    expect(screen.getByText(/Propietario: Juan Pérez/i)).toBeInTheDocument();
    expect(screen.getByText(/Deuda de este vehículo:.*15/i)).toBeInTheDocument();

    // Input amount should contain the default debt amount
    const amountInput = screen.getByLabelText(/Monto a Abonar/i) as HTMLInputElement;
    expect(amountInput.value).toBe("15000");

    // Change amount to 10000
    fireEvent.change(amountInput, { target: { value: "10000" } });
    expect(amountInput.value).toBe("10000");

    // Change payment method to TRANSFER
    const dialog = screen.getByRole("dialog");
    const select = within(dialog).getByTestId("mock-select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "TRANSFER" } });
    expect(select.value).toBe("TRANSFER");

    // Click Confirmar Pago
    const confirmBtn = screen.getByRole("button", { name: /Confirmar Pago/i });
    fireEvent.click(confirmBtn);

    // Expect fetch to be called with correct payload
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/customers/cust-1/payments",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            amount: 10000,
            method: "TRANSFER",
            notes: "Pago de saldo deudor del vehículo AF719HZ",
          }),
        })
      );
    });

    // Expect alert to be called with success variant
    expect(mockAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Pago registrado",
        variant: "success",
      })
    );
  });

  it("filters vehicles by start date correctly", () => {
    render(
      <TooltipProvider>
        <VehiclesClient initialVehicles={mockVehicles} totalVehicles={2} />
      </TooltipProvider>
    );

    // Both should be visible initially
    expect(screen.getAllByRole("listitem").length).toBe(2);

    // Set start date to 2026-07-23 (v-1 is 2026-07-21, v-2 is 2026-07-25)
    const startDateInput = screen.getByLabelText("Fecha de ingreso desde");
    fireEvent.change(startDateInput, { target: { value: "2026-07-23" } });

    // Only v-2 should be visible
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(1);
    expect(screen.getByTestId("item-v-2")).toBeInTheDocument();
    expect(screen.queryByTestId("item-v-1")).not.toBeInTheDocument();
  });

  it("filters vehicles by end date correctly", () => {
    render(
      <TooltipProvider>
        <VehiclesClient initialVehicles={mockVehicles} totalVehicles={2} />
      </TooltipProvider>
    );

    // Set end date to 2026-07-23
    const endDateInput = screen.getByLabelText("Fecha de ingreso hasta");
    fireEvent.change(endDateInput, { target: { value: "2026-07-23" } });

    // Only v-1 should be visible
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(1);
    expect(screen.getByTestId("item-v-1")).toBeInTheDocument();
    expect(screen.queryByTestId("item-v-2")).not.toBeInTheDocument();
  });

  it("clears date filters and restores all vehicles when reset button is clicked", () => {
    render(
      <TooltipProvider>
        <VehiclesClient initialVehicles={mockVehicles} totalVehicles={2} />
      </TooltipProvider>
    );

    // Apply some filters
    const startDateInput = screen.getByLabelText("Fecha de ingreso desde") as HTMLInputElement;
    fireEvent.change(startDateInput, { target: { value: "2026-07-23" } });
    expect(screen.getAllByRole("listitem").length).toBe(1);

    // Click "Limpiar filtros" button
    const clearBtn = screen.getByRole("button", { name: /Limpiar filtros/i });
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);

    // Both should be restored, and inputs cleared
    expect(screen.getAllByRole("listitem").length).toBe(2);
    expect(startDateInput.value).toBe("");
  });
});
