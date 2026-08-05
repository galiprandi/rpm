import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import CustomersClient from "./CustomersClient";
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
  Header: ({ title, description, secondaryActions }: any) => (
    <div data-testid="header">
      <h1>{title}</h1>
      <p>{description}</p>
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
          <span className="label">{stat.label}</span>: <span className="value">{stat.value}</span>
        </div>
      ))}
    </div>
  ),
  CrudAdmin: ({ items, onExport, onCreate, rowActions }: any) => (
    <div data-testid="crud-admin">
      <button onClick={onExport} data-testid="export-btn">Exportar CSV</button>
      {onCreate && <button onClick={onCreate} data-testid="create-btn">Nuevo Cliente</button>}
      <ul>
        {items?.map((item: any, idx: number) => {
          return (
            <li key={idx} data-testid={`item-${item.id}`}>
              <span className="name">{item.name}</span>
              <span className="balance">{item.balance}</span>
              {rowActions && <div data-testid={`actions-${item.id}`}>{rowActions(item)}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  ),
}));

vi.mock("@/components/customers/CustomerDialog", () => ({
  CustomerDialog: ({ isOpen, onClose }: any) => (
    isOpen ? (
      <div data-testid="customer-dialog">
        <span>Mocked Customer Dialog</span>
        <button onClick={onClose} data-testid="close-dialog-btn">Close Dialog</button>
      </div>
    ) : null
  ),
}));

describe("CustomersClient", () => {
  const mockCustomers = [
    {
      id: "cust-1",
      name: "Juan Pérez",
      phone: "3411234567",
      phoneAlt: null,
      email: "juan@perez.com",
      address: "Av. Pellegrini 1200",
      balance: 15000,
      vehicles: [{ id: "v-1", identifier: "AF719HZ", category: "CAR" }],
      _count: { workOrders: 1 },
    },
    {
      id: "cust-2",
      name: "María Gómez",
      phone: "3419876543",
      phoneAlt: null,
      email: "maria@gomez.com",
      address: "Bv. Oroño 500",
      balance: 0,
      vehicles: [],
      _count: { workOrders: 0 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly and displays customers list and stats", () => {
    render(
      <TooltipProvider>
        <CustomersClient initialCustomers={mockCustomers} />
      </TooltipProvider>
    );

    expect(screen.getByText("Clientes")).toBeInTheDocument();
    expect(screen.getByTestId("stats")).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(2);
  });

  it("opens the payment registration dialog, handles input, and registers a payment successfully", async () => {
    // Mock fetch globally based on URL
    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url.includes("/api/customers")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ customers: mockCustomers }),
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
        <CustomersClient initialCustomers={mockCustomers} />
      </TooltipProvider>
    );

    // cust-1 has positive balance (15000), so it should have the Registrar Pago button.
    // cust-2 has 0 balance, so no button.
    const payBtn = screen.getByRole("button", {
      name: /Registrar pago para Juan Pérez/i,
    });
    expect(payBtn).toBeInTheDocument();

    // Click pay button to open dialog
    fireEvent.click(payBtn);

    // Dialog title should be present
    expect(screen.getByText("Registrar Pago")).toBeInTheDocument();
    expect(screen.getByText(/Cliente: Juan Pérez/i)).toBeInTheDocument();
    expect(screen.getByText(/Saldo actual:.*15/i)).toBeInTheDocument();

    // Input amount should contain the default debt amount
    const amountInput = screen.getByLabelText(/Monto a Abonar/i) as HTMLInputElement;
    expect(amountInput.value).toBe("15000");

    // Change amount to 12000
    fireEvent.change(amountInput, { target: { value: "12000" } });
    expect(amountInput.value).toBe("12000");

    // Change payment method to CARD
    const select = screen.getByTestId("mock-select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "CARD" } });
    expect(select.value).toBe("CARD");

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
            amount: 12000,
            method: "CARD",
            notes: "Pago registrado desde Listado de Clientes",
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
});
