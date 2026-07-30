import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import CustomerDetailPage from "./page";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "cust-1" }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

// Mock useUI
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
  },
}));

// Mock Select components for easy testing under JSDOM
vi.mock("@/components/ui/select", () => {
  return {
    Select: ({ value, onValueChange }: any) => (
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        data-testid="mock-select"
      >
        <option value="ALL">Todos los tipos</option>
        <option value="DIRECT_SALE">Ventas</option>
        <option value="CREDIT_NOTE">Notas de Crédito</option>
        <option value="PAYMENT">Pagos</option>
        <option value="INVOICE">Facturas (OTs)</option>
      </select>
    ),
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  };
});

// Mock other Dialogs to avoid render complexity
vi.mock("@/components/customers/CustomerForm", () => ({
  CustomerForm: () => <div data-testid="customer-form">Mock CustomerForm</div>,
}));
vi.mock("@/components/vehicles/VehicleDialog", () => ({
  VehicleDialog: () => <div data-testid="vehicle-dialog">Mock VehicleDialog</div>,
}));
vi.mock("@/components/credit-notes/CustomerCreditNoteDialog", () => ({
  CustomerCreditNoteDialog: () => <div data-testid="credit-note-dialog">Mock CreditNoteDialog</div>,
}));

const mockCustomer = {
  id: "cust-1",
  name: "John Doe",
  phone: "+54 9 11 1234-5678",
  phoneAlt: "+54 9 11 9876-5432",
  email: "john@example.com",
  address: "Calle Falsa 123",
  notes: "Some notes",
  billingData: {
    cuit: "20-30123456-3",
    invoiceType: "A",
  },
  createdAt: "2026-07-01T12:00:00.000Z",
  balance: 10000,
  vehicles: [
    {
      id: "v-1",
      identifier: "ABC123",
      category: "CAR",
      vehicleMake: { name: "Ford" },
      vehicleModel: { name: "Fiesta" },
      year: 2018,
    },
  ],
  workOrders: [
    {
      id: "wo-1",
      status: "READY",
      total: 10000,
      createdAt: "2026-07-02T12:00:00.000Z",
      vehicle: { identifier: "ABC123" },
      vehicleId: "v-1",
    },
  ],
  directSales: [
    {
      id: "ds-1",
      total: 5000,
      createdAt: "2026-07-03T12:00:00.000Z",
      customerName: "John Doe",
      items: [{ name: "Aceite", quantity: 1 }],
    },
  ],
  creditNotes: [],
  payments: [
    {
      id: "pay-1",
      amount: 5000,
      method: "CASH",
      notes: "Payment notes",
      createdAt: "2026-07-04T12:00:00.000Z",
    },
  ],
};

describe("CustomerDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global fetch
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/customers/cust-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCustomer),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Not found" }),
      });
    });
  });

  it("renders detail page and loads customer info and transactions list", async () => {
    render(
      <TooltipProvider>
        <CustomerDetailPage />
      </TooltipProvider>
    );

    // Should render loading state first
    expect(screen.getByText("Cargando...")).toBeInTheDocument();

    // Wait for the customer to load
    await waitFor(() => {
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument();
    });

    // Verify basic info - use getAllByText since John Doe, email and phone are rendered in multiple sections (detail and print-only section)
    expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
    expect(screen.getAllByText("+54 9 11 1234-5678")[0]).toBeInTheDocument();
    expect(screen.getAllByText("john@example.com")[0]).toBeInTheDocument();

    // Verify balance
    expect(screen.getAllByText("$ 10.000,00")[0]).toBeInTheDocument();

    // Verify transactions Table Header
    expect(screen.getByText(/Historial de Transacciones/i)).toBeInTheDocument();

    // We have 3 transactions in mockCustomer:
    // 1. Direct Sale (ds-1)
    // 2. Work Order (wo-1)
    // 3. Payment (pay-1)
    // All 3 should be rendered in the table initially
    const tableTitle = screen.getByText(/Historial de Transacciones \(3\)/i);
    expect(tableTitle).toBeInTheDocument();
  });

  it("correctly filters transactions by type using the dropdown selector", async () => {
    render(
      <TooltipProvider>
        <CustomerDetailPage />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument();
    });

    // Verify Select dropdown is present
    const select = screen.getByTestId("mock-select") as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe("ALL");

    // Filter by Payments (PAYMENT)
    fireEvent.change(select, { target: { value: "PAYMENT" } });

    // Table title should update to show only 1 transaction
    expect(screen.getByText(/Historial de Transacciones \(1\)/i)).toBeInTheDocument();

    // Filter by Direct Sales (DIRECT_SALE)
    fireEvent.change(select, { target: { value: "DIRECT_SALE" } });
    expect(screen.getByText(/Historial de Transacciones \(1\)/i)).toBeInTheDocument();

    // Filter back to ALL
    fireEvent.change(select, { target: { value: "ALL" } });
    expect(screen.getByText(/Historial de Transacciones \(3\)/i)).toBeInTheDocument();
  });
});
