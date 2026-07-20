/**
 * Unit tests for BotMessageContent component.
 *
 * Verifies:
 * - Proper text segmentation and action extraction
 * - Grouping of adjacent action buttons into an inline flex container
 * - Callback invocation when actions are clicked
 * - Disabled state propagation to button components
 *
 * Related: components/bot/BotMessageContent.tsx
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BotMessageContent } from "@/components/bot/BotMessageContent";

// Mock streamdown as a simple pass-through to prevent external styling/rendering issues in JSDOM
vi.mock("streamdown", () => ({
  Streamdown: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="streamdown">{children}</div>
  ),
}));

describe("BotMessageContent", () => {
  it("renders plain text without actions", () => {
    render(<BotMessageContent text="Hola, ¿en qué puedo ayudarte?" />);
    expect(screen.getByText("Hola, ¿en qué puedo ayudarte?")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders plain text when onAction is not provided", () => {
    render(<BotMessageContent text="¿Querés [Confirmar]?" />);
    expect(screen.getByText("¿Querés [Confirmar]?")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("extracts and renders single known actions as buttons", () => {
    const onAction = vi.fn();
    render(<BotMessageContent text="¿Confirmar acción? [Confirmar]" onAction={onAction} />);

    expect(screen.getByTestId("streamdown")).toHaveTextContent("¿Confirmar acción?");
    const confirmButton = screen.getByRole("button", { name: /confirmar/i });
    expect(confirmButton).toBeInTheDocument();

    fireEvent.click(confirmButton);
    expect(onAction).toHaveBeenCalledWith("Confirmar");
  });

  it("groups consecutive actions side-by-side in a flex container", () => {
    const onAction = vi.fn();
    render(<BotMessageContent text="¿Estás seguro? [Confirmar] [Cancelar]" onAction={onAction} />);

    expect(screen.getByTestId("streamdown")).toHaveTextContent("¿Estás seguro?");
    const confirmButton = screen.getByRole("button", { name: /confirmar/i });
    const cancelButton = screen.getByRole("button", { name: /cancelar/i });

    expect(confirmButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();

    // Check they are siblings under the same flex container
    const flexContainer = confirmButton.parentElement;
    expect(flexContainer).toHaveClass("flex", "flex-wrap", "gap-2");
    expect(cancelButton.parentElement).toBe(flexContainer);
  });

  it("disables all action buttons when disabled is true", () => {
    render(
      <BotMessageContent
        text="¿Seguir? [Sí] [No]"
        onAction={vi.fn()}
        disabled={true}
      />,
    );

    const yesButton = screen.getByRole("button", { name: /sí/i });
    const noButton = screen.getByRole("button", { name: /no/i });

    expect(yesButton).toBeDisabled();
    expect(noButton).toBeDisabled();
  });

  it("filters out unknown actions from rendering as buttons", () => {
    render(
      <BotMessageContent
        text="Esto es un [BotonFalso] que no está en la lista."
        onAction={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
