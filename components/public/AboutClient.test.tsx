import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { AboutClient } from "./AboutClient";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock IntersectionObserver constructor for framer-motion which uses viewport observations
beforeEach(() => {
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  global.IntersectionObserver = MockIntersectionObserver as any;
});

interface DialogProps {
  children?: React.ReactNode;
  open?: boolean;
}

interface ClassNameProps {
  children?: React.ReactNode;
  className?: string;
}

// Mock dialog component content/overlay for vitest jsdom environment
vi.mock("@/components/ui/dialog", () => {
  return {
    Dialog: ({ children, open }: DialogProps) => {
      if (!open) return null;
      return (
        <div role="dialog" data-state="open" data-testid="quickview-dialog">
          {children}
        </div>
      );
    },
    DialogContent: ({ children, className }: ClassNameProps) => {
      return <div className={className}>{children}</div>;
    },
    DialogHeader: ({ children, className }: ClassNameProps) => {
      return <div className={className}>{children}</div>;
    },
    DialogTitle: ({ children, className }: ClassNameProps) => {
      return <h2 className={className}>{children}</h2>;
    },
  };
});

// Mock useSearchParams from next/navigation
const mockGetParam = vi.fn().mockReturnValue(null);
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: mockGetParam,
  }),
}));

describe("AboutClient Keyboard Accessibility and Semantics", () => {
  it("renders about page content and milestone cards", () => {
    render(
      <TooltipProvider>
        <AboutClient />
      </TooltipProvider>,
    );

    // Verify page headers are rendered
    expect(screen.getByText("Nuestra Historia")).toBeInTheDocument();
    expect(screen.getByText(/PASIÓN POR/i)).toBeInTheDocument();

    // Verify milestone cards are rendered
    expect(screen.getByText("Taller de Iluminación")).toBeInTheDocument();
    expect(screen.getByText("Estudio de Estética")).toBeInTheDocument();
    expect(screen.getByText("Laboratorio Electrónico")).toBeInTheDocument();
  });

  it("verifies cards are keyboard focusable, have the button role, and have correct aria-labels", () => {
    render(
      <TooltipProvider>
        <AboutClient />
      </TooltipProvider>,
    );

    // Find cards by role 'button'
    const cards = screen.getAllByRole("button", {
      name: /ver detalles del hito:/i,
    });
    expect(cards).toHaveLength(4);

    // Verify tabIndex and accessibility properties on each card
    cards.forEach((card) => {
      expect(card).toHaveAttribute("tabIndex", "0");
      expect(card).toHaveClass("focus-visible:ring-2");
      expect(card).toHaveClass("focus-visible:ring-brand");
    });
  });

  it("triggers milestone quick view on clicking a card", async () => {
    render(
      <TooltipProvider>
        <AboutClient />
      </TooltipProvider>,
    );

    const card = screen.getByRole("button", {
      name: "Ver detalles del hito: Taller de Iluminación",
    });

    // Quickview should not be open initially
    expect(screen.queryByTestId("quickview-dialog")).not.toBeInTheDocument();

    // Click on the card
    fireEvent.click(card);

    // Quickview dialog should now be open
    await waitFor(() => {
      expect(screen.getByTestId("quickview-dialog")).toBeInTheDocument();
    });

    // It should render details inside the quickview
    expect(
      screen.getByText("Tecnología Bi-LED de alto flujo"),
    ).toBeInTheDocument();
  });

  it("triggers milestone quick view on focusing and pressing Enter or Space", async () => {
    render(
      <TooltipProvider>
        <AboutClient />
      </TooltipProvider>,
    );

    const card = screen.getByRole("button", {
      name: "Ver detalles del hito: Estudio de Estética",
    });

    // Quickview should not be open initially
    expect(screen.queryByTestId("quickview-dialog")).not.toBeInTheDocument();

    // Trigger keypress Enter on card
    fireEvent.keyDown(card, { key: "Enter", code: "Enter" });

    // Quickview dialog should now be open
    await waitFor(() => {
      expect(screen.getByTestId("quickview-dialog")).toBeInTheDocument();
    });

    expect(screen.getByText("Láminas PPF Pro-Shield")).toBeInTheDocument();
  });
});
