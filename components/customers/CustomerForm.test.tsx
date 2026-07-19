import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomerForm } from "@/components/customers/CustomerForm";
import type { CustomerFormData } from "@/components/customers/CustomerForm";

describe("CustomerForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render essential fields and handle basic text input", async () => {
    const onSubmit = vi.fn();
    render(<CustomerForm onSubmit={onSubmit} />);

    // Name field
    const nameInput = screen.getByLabelText(/Nombre o Razón Social/i);
    fireEvent.change(nameInput, { target: { value: "Juan Pérez" } });
    expect(nameInput).toHaveValue("Juan Pérez");

    // Phone field
    const phoneInput = screen.getByLabelText("Teléfono Principal");
    fireEvent.change(phoneInput, { target: { value: "+54 11 1234-5678" } });
    expect(phoneInput).toHaveValue("+54 11 1234-5678");

    // Email field
    const emailInput = screen.getByLabelText("Correo electrónico");
    fireEvent.change(emailInput, { target: { value: "juan@perez.com" } });
    expect(emailInput).toHaveValue("juan@perez.com");

    // Address field
    const addressInput = screen.getByLabelText("Dirección de domicilio");
    fireEvent.change(addressInput, { target: { value: "Calle Falsa 123" } });
    expect(addressInput).toHaveValue("Calle Falsa 123");

    // Submit
    const submitButton = screen.getByRole("button", { name: "Guardar" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedData = onSubmit.mock.calls[0][0] as CustomerFormData;
    expect(submittedData.name).toBe("Juan Pérez");
    expect(submittedData.phone).toBe("+54 11 1234-5678");
    expect(submittedData.email).toBe("juan@perez.com");
    expect(submittedData.address).toBe("Calle Falsa 123");
  });

  it("should populate initialData on load", () => {
    render(
      <CustomerForm
        onSubmit={vi.fn()}
        initialData={{
          name: "Carlos Gómez",
          phone: "11223344",
          email: "carlos@gomez.com",
          address: "Av. Corrientes 1000",
          notes: "Alguna nota",
        }}
      />
    );

    expect(screen.getByLabelText(/Nombre o Razón Social/i)).toHaveValue("Carlos Gómez");
    expect(screen.getByLabelText("Teléfono Principal")).toHaveValue("11223344");
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("carlos@gomez.com");
    expect(screen.getByLabelText("Dirección de domicilio")).toHaveValue("Av. Corrientes 1000");
    expect(screen.getByLabelText("Notas u observaciones adicionales")).toHaveValue("Alguna nota");
  });

  it("should prevent submission if isSubmitting is true (double-click protection)", async () => {
    const onSubmit = vi.fn();
    render(<CustomerForm onSubmit={onSubmit} isSubmitting={true} />);

    const nameInput = screen.getByLabelText(/Nombre o Razón Social/i);
    fireEvent.change(nameInput, { target: { value: "Esteban" } });

    const submitButton = screen.getByRole("button", { name: /Guardando\.\.\./i });
    expect(submitButton).toBeDisabled();

    // Directly click form submit or call fireEvent.submit
    const form = nameInput.closest("form");
    if (form) {
      fireEvent.submit(form);
    }

    // Wait and ensure onSubmit was never called due to guard and disabled state
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("should perform real-time CUIT validation when exactly 11 numeric digits are typed", async () => {
    render(<CustomerForm onSubmit={vi.fn()} />);

    // Open Billing Data section
    const billingButton = screen.getByRole("button", { name: /Datos de Facturación/i });
    fireEvent.click(billingButton);

    const cuitInput = screen.getByPlaceholderText("20-XXXXXXXX-X");

    // Type an invalid CUIT of 11 digits (e.g. 20123456789 is invalid due to check digit)
    fireEvent.change(cuitInput, { target: { value: "20123456789" } });
    expect(cuitInput).toHaveValue("20-12345678-9"); // auto-formatted

    // It should immediately show error because length is 11 clean digits
    expect(screen.getByText(/CUIT\/CUIL inválido/i)).toBeInTheDocument();
    expect(screen.queryByText(/CUIT válido/i)).not.toBeInTheDocument();

    // Type a valid CUIT of 11 digits (e.g. 20301234563)
    fireEvent.change(cuitInput, { target: { value: "20301234563" } });
    expect(cuitInput).toHaveValue("20-30123456-3");

    // The error should disappear and success should show up!
    expect(screen.queryByText(/CUIT\/CUIL inválido/i)).not.toBeInTheDocument();
    expect(screen.getByText(/CUIT válido/i)).toBeInTheDocument();
  });

  it("should validate CUIT on blur and show length error if less than 11 digits are filled", () => {
    render(<CustomerForm onSubmit={vi.fn()} />);

    const billingButton = screen.getByRole("button", { name: /Datos de Facturación/i });
    fireEvent.click(billingButton);

    const cuitInput = screen.getByPlaceholderText("20-XXXXXXXX-X");

    // Enter less than 11 digits (e.g. "20-1234")
    fireEvent.change(cuitInput, { target: { value: "201234" } });
    expect(screen.queryByText(/El CUIT debe tener 11 dígitos/i)).not.toBeInTheDocument();

    // Trigger blur
    fireEvent.blur(cuitInput);
    expect(screen.getByText(/El CUIT debe tener 11 dígitos/i)).toBeInTheDocument();
  });
});
