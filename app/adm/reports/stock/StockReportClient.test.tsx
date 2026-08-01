import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import StockReportClient from "./StockReportClient";
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

describe("StockReportClient", () => {
  const mockResponse = {
    totalValue: 5000000,
    inventoryTurnover: 2.5,
    deadStockValue: 120000,
    deadStockCount: 3,
    totalProducts: 1500,
    activeProducts: 1450,
    lowStockCount: 5,
    categoryDistribution: [
      { id: "cat-1", name: "Iluminación", count: 200, value: 1500000 },
      { id: "cat-2", name: "Detailing", count: 150, value: 800000 },
    ],
    topValuedProducts: [
      { id: "prod-1", name: "LED Bi-LED projector", stock: 50, value: 450000 },
      { id: "prod-2", name: "Cargador Inteligente 12V", stock: 30, value: 240000 },
    ],
    lowStockProducts: [
      { id: "prod-3", name: "Foco H7 común", stock: 2, minStock: 10, category: "Iluminación" },
    ],
    deadStockProducts: [
      { id: "prod-4", name: "Cera Carnauba Gold", stock: 5, value: 15000, lastMovement: "2026-03-01" },
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

  it("renders the stock report and loads data successfully", async () => {
    render(
      <TooltipProvider>
        <StockReportClient />
      </TooltipProvider>
    );

    expect(screen.getByText(/Stock & Inventario/i)).toBeInTheDocument();

    await waitFor(() => {
      // LED Bi-LED projector appears in both interactive card and print-only section
      expect(screen.getAllByText(/LED Bi-LED projector/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Cargador Inteligente 12V/i)[0]).toBeInTheDocument();
    });

    // Check key metrics are rendered
    expect(screen.getAllByText(/Valor Total Stock/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Rotación de Stock/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Stock Inmovilizado/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Unidades en Stock/i)[0]).toBeInTheDocument();
  });

  it("triggers window.print() when clicking the Imprimir button", async () => {
    render(
      <TooltipProvider>
        <StockReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/LED Bi-LED projector/i)[0]).toBeInTheDocument();
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
        <StockReportClient />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/LED Bi-LED projector/i)[0]).toBeInTheDocument();
    });

    // Verify corporate header in print view is rendered
    const companyHeader = screen.getAllByText(/RPM ACCESORIOS/i)[0];
    expect(companyHeader).toBeInTheDocument();

    // Verify print layout contains category detailing and product at index 1
    expect(screen.getAllByText(/LED Bi-LED projector/i)[1]).toBeInTheDocument();
    expect(screen.getAllByText(/Foco H7 común/i)[0]).toBeInTheDocument();

    // Auditor/Responsable blocks should be present
    expect(screen.getByText(/Responsable de Depósito/i)).toBeInTheDocument();
    expect(screen.getByText(/Firma Autorizada Gerencia/i)).toBeInTheDocument();
  });
});
