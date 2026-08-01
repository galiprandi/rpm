import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import CustomersReportClient from "./CustomersReportClient";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock UI Provider
vi.mock("@/components/ui/UIProvider", () => ({
  useUI: () => ({
    alert: vi.fn(),
  }),
}));

// Mock Header
vi.mock("@/components/adm/Header", () => ({
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
}));

// Mock window.print
const printMock = vi.fn();
if (typeof window !== "undefined") {
  window.print = printMock;
}

describe("CustomersReportClient", () => {
  const mockResponse = {
    newCustomers: { current: 15, previous: 10, change: 50 },
    activeCustomers: { current: 120, previous: 110, change: 9.09 },
    recurrenceRate: { current: 35.5, previous: 30, change: 18.33 },
    evolution: [
      { label: "Jun", count: 10 },
      { label: "Jul", count: 15 },
    ],
    topCustomers: [
      { id: "cust-1", name: "Juan Pérez", totalBilling: 150000, ordersCount: 5, lastOrderDate: "2026-07-28" },
      { id: "cust-2", name: "María López", totalBilling: 120000, ordersCount: 4, lastOrderDate: "2026-07-29" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    printMock.mockClear();

    // Mock global fetch
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    ) as any;
  });

  it("renders the customers report and loads data successfully", async () => {
    render(
      <TooltipProvider>
        <CustomersReportClient />
      </TooltipProvider>
    );

    expect(screen.getByText(/Reporte de Clientes/i)).toBeInTheDocument();

    await waitFor(() => {
      // Juan Pérez appears in both interactive table and print-only section
      expect(screen.getAllByText(/Juan Pérez/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/María López/i)[0]).toBeInTheDocument();
    });

    // Check key metrics are rendered
    expect(screen.getAllByText(/Clientes Nuevos/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Clientes Activos/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Tasa de Recurrencia/i)[0]).toBeInTheDocument();
  });

  it("triggers window.print() when clicking the Imprimir button", async () => {
    render(
      <TooltipProvider>
        <CustomersReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Juan Pérez/i)[0]).toBeInTheDocument();
    });

    const printBtn = screen.getByRole("button", { name: /Imprimir/i });
    expect(printBtn).toBeInTheDocument();
    expect(printBtn).not.toBeDisabled();

    printBtn.click();

    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it("renders the print-only view container with the correct info", async () => {
    render(
      <TooltipProvider>
        <CustomersReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Juan Pérez/i)[0]).toBeInTheDocument();
    });

    // Verify corporate header in print view is rendered
    const companyHeader = screen.getAllByText(/RPM ACCESORIOS/i)[0];
    expect(companyHeader).toBeInTheDocument();

    // Verify print layout contains Juan Pérez at index 1 (the print-only table)
    expect(screen.getAllByText(/Juan Pérez/i)[1]).toBeInTheDocument();

    // Auditor/Responsable blocks should be present
    expect(screen.getByText(/Responsable de Administración/i)).toBeInTheDocument();
    expect(screen.getByText(/Firma Autorizada Gerencia/i)).toBeInTheDocument();
  });
});
