import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { WhatsAppTemplateDialog } from "./WhatsAppTemplateDialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { formatARS } from "@/lib/utils/format";

// Mock Select component because standard select interaction under JSDOM
// might get complicated with Radix select. We mock Select globally for this test.
vi.mock("@/components/ui/select", () => {
  return {
    Select: ({ value, onValueChange }: any) => (
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        data-testid="mock-select"
      >
        <option value="DEBT">Recordatorio de Deuda</option>
        <option value="READY">Vehículo Listo para Retirar</option>
        <option value="GREETING">Contacto General / Saludo</option>
      </select>
    ),
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  };
});

describe("WhatsAppTemplateDialog", () => {
  const mockOnClose = vi.fn();
  const mockWindowOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.open
    global.window.open = mockWindowOpen as any;
  });

  it("defaults to DEBT template when balance is greater than 0", () => {
    render(
      <TooltipProvider>
        <WhatsAppTemplateDialog
          isOpen={true}
          onClose={mockOnClose}
          phone="+54 9 11 1234-5678"
          customerName="Juan Pérez"
          balance={15000}
          vehicles={["ABC123"]}
        />
      </TooltipProvider>
    );

    // Verify Title and description are there
    expect(screen.getByText("Notificar por WhatsApp")).toBeInTheDocument();
    expect(screen.getByText(/Personaliza el mensaje antes de enviarlo/i)).toBeInTheDocument();

    // Verify default value of select
    const select = screen.getByTestId("mock-select") as HTMLSelectElement;
    expect(select.value).toBe("DEBT");

    // Verify Textarea contains debt text
    const textarea = screen.getByLabelText(/Mensaje/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain("Hola Juan Pérez!");
    expect(textarea.value).toContain("un saldo pendiente de");
    expect(textarea.value).toContain(formatARS(15000));
  });

  it("defaults to READY template when balance is 0 but vehicles are present", () => {
    render(
      <TooltipProvider>
        <WhatsAppTemplateDialog
          isOpen={true}
          onClose={mockOnClose}
          phone="+54 9 11 1234-5678"
          customerName="Juan Pérez"
          balance={0}
          vehicles={["ABC123"]}
        />
      </TooltipProvider>
    );

    const select = screen.getByTestId("mock-select") as HTMLSelectElement;
    expect(select.value).toBe("READY");

    const textarea = screen.getByLabelText(/Mensaje/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain("Hola Juan Pérez!");
    expect(textarea.value).toContain("ya está listo para retirar");
    expect(textarea.value).toContain("ABC123");
    expect(textarea.value).toContain("La orden se encuentra totalmente abonada");
  });

  it("defaults to GREETING template when there is no balance and no vehicles", () => {
    render(
      <TooltipProvider>
        <WhatsAppTemplateDialog
          isOpen={true}
          onClose={mockOnClose}
          phone="+54 9 11 1234-5678"
          customerName="Juan Pérez"
          balance={0}
          vehicles={[]}
        />
      </TooltipProvider>
    );

    const select = screen.getByTestId("mock-select") as HTMLSelectElement;
    expect(select.value).toBe("GREETING");

    const textarea = screen.getByLabelText(/Mensaje/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain("Hola Juan Pérez!");
    expect(textarea.value).toContain("Te escribimos desde *RPM Accesorios*.");
  });

  it("updates template and permits custom editing in textarea", () => {
    render(
      <TooltipProvider>
        <WhatsAppTemplateDialog
          isOpen={true}
          onClose={mockOnClose}
          phone="+54 9 11 1234-5678"
          customerName="Juan Pérez"
          balance={5000}
        />
      </TooltipProvider>
    );

    const select = screen.getByTestId("mock-select") as HTMLSelectElement;
    expect(select.value).toBe("DEBT");

    // Change template to GREETING
    fireEvent.change(select, { target: { value: "GREETING" } });

    const textarea = screen.getByLabelText(/Mensaje/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain("Te escribimos desde *RPM Accesorios*.");

    // Direct custom editing
    fireEvent.change(textarea, { target: { value: "Custom direct edit message text." } });
    expect(textarea.value).toBe("Custom direct edit message text.");
  });

  it("normalizes phone and calls window.open on send button click", () => {
    render(
      <TooltipProvider>
        <WhatsAppTemplateDialog
          isOpen={true}
          onClose={mockOnClose}
          phone="+54 9 11 1234-5678"
          customerName="Juan Pérez"
          balance={0}
          vehicles={[]}
        />
      </TooltipProvider>
    );

    const textarea = screen.getByLabelText(/Mensaje/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Custom edit text" } });

    const sendButton = screen.getByRole("button", { name: /Enviar WhatsApp/i });
    fireEvent.click(sendButton);

    // phone "+54 9 11 1234-5678" cleans to "5491112345678"
    expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    expect(mockWindowOpen).toHaveBeenCalledWith(
      "https://wa.me/5491112345678?text=Custom%20edit%20text",
      "_blank",
      "noopener,noreferrer"
    );
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
