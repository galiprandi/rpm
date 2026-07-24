import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import CustomersClient from "./CustomersClient";
import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

let lastSecondaryActions: any[] = [];

// Mock components and hooks
vi.mock("@/components/adm", () => ({
  Header: ({ secondaryActions }: any) => {
    lastSecondaryActions = secondaryActions;
    return <div data-testid="header" />;
  },
  CrudAdmin: () => <div data-testid="crud-admin" />,
  CrudStats: () => <div data-testid="crud-stats" />,
}));

vi.mock("@/components/customers/CustomerDialog", () => ({
  CustomerDialog: () => <div data-testid="customer-dialog" />,
}));

const mockAlert = vi.fn();
vi.mock("@/components/ui/UIProvider", () => ({
  useUI: () => ({
    alert: mockAlert,
  }),
}));

// Mock router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("CustomersClient Recalculate Balances Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastSecondaryActions = [];
    global.fetch = vi.fn();
  });

  const mockCustomers = [
    {
      id: "1",
      name: "Juan Pérez",
      phone: "11223344",
      balance: 1500,
      vehicles: [],
      _count: { workOrders: 1 },
    },
  ];

  it("should NOT render Recalcular Saldos action if user is not ADMIN", () => {
    render(
      <TooltipProvider>
        <CustomersClient initialCustomers={mockCustomers} isAdmin={false} />
      </TooltipProvider>,
    );

    // Verify header rendered
    expect(screen.getByTestId("header")).toBeInTheDocument();

    // Verify secondary actions does not have "Recalcular Saldos"
    const recalculateAction = lastSecondaryActions?.find(
      (action) => action.label === "Recalcular Saldos",
    );
    expect(recalculateAction).toBeUndefined();
  });

  it("should render Recalcular Saldos action if user is ADMIN", () => {
    render(
      <TooltipProvider>
        <CustomersClient initialCustomers={mockCustomers} isAdmin={true} />
      </TooltipProvider>,
    );

    // Verify header rendered
    expect(screen.getByTestId("header")).toBeInTheDocument();

    // Verify secondary actions does have "Recalcular Saldos"
    const recalculateAction = lastSecondaryActions?.find(
      (action) => action.label === "Recalcular Saldos",
    );
    expect(recalculateAction).toBeDefined();
    expect(recalculateAction.disabled).toBeFalsy();
  });

  it("should trigger POST and show success alert when action is clicked", async () => {
    const mockResponse = {
      success: true,
      customersProcessed: 1,
      driftsFound: 0,
      totalDrift: 0,
    };

    const mockCustomersResponse = {
      customers: mockCustomers,
    };

    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/api/admin/recalculate-balances")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockResponse,
        });
      }
      if (url.includes("/api/customers")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCustomersResponse,
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <TooltipProvider>
        <CustomersClient initialCustomers={mockCustomers} isAdmin={true} />
      </TooltipProvider>,
    );

    const recalculateAction = lastSecondaryActions?.find(
      (action) => action.label === "Recalcular Saldos",
    );
    expect(recalculateAction).toBeDefined();

    // Trigger action wrapped in act
    await act(async () => {
      recalculateAction.onClick();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/recalculate-balances",
        expect.objectContaining({ method: "POST" }),
      );
    });

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Saldos Recalculados",
          variant: "success",
        }),
      );
    });
  });
});
