import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VehicleDialog } from "@/components/vehicles/VehicleDialog";

// Mock useUI
const mockAlert = vi.fn();
vi.mock("@/components/ui/UIProvider", () => ({
  useUI: () => ({
    alert: mockAlert,
  }),
}));

// Mock plate-validation
vi.mock("@/lib/utils/plate-validation", () => ({
  validatePlate: () => true,
  getPlateFormatHint: () => "Ej: ABC123",
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

// Mock VehicleForm to avoid deep testing form inputs inside dialog tests
vi.mock("./VehicleForm", () => ({
  VehicleForm: ({ onSubmit, onCancel }: { onSubmit: any; onCancel: any }) => (
    <div>
      <button onClick={() => onSubmit({ identifier: "AB123CD", category: "CAR" })}>
        Submit Technical Form
      </button>
      <button onClick={onCancel}>Cancel Technical Form</button>
    </div>
  ),
}));

describe("VehicleDialog - Inline Customer Creation with Argentine Phone Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should open customer inline creation form when clicking 'Crear nuevo'", async () => {
    render(<VehicleDialog open={true} onOpenChange={vi.fn()} />);

    // Click on "Crear nuevo" button
    const createNewButton = screen.getByRole("button", { name: /crear nuevo/i });
    fireEvent.click(createNewButton);

    // Verify fields of new customer inline form are displayed
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^teléfono\*?$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("should validate and format Argentine phone number on input change and onBlur", async () => {
    render(<VehicleDialog open={true} onOpenChange={vi.fn()} />);

    const createNewButton = screen.getByRole("button", { name: /crear nuevo/i });
    fireEvent.click(createNewButton);

    const phoneInput = screen.getByLabelText(/^teléfono\*?$/i);

    // Input an incomplete number (less than 10 digits), should not show valid badge
    fireEvent.change(phoneInput, { target: { value: "1134" } });
    expect(screen.queryByText(/teléfono válido/i)).not.toBeInTheDocument();

    // Input a valid 10 digit number (AMBA prefix code + local number), should validate and format immediately
    fireEvent.change(phoneInput, { target: { value: "1155556666" } });
    expect(screen.getByText(/teléfono válido \(AMBA \/ Buenos Aires\)/i)).toBeInTheDocument();
    expect(phoneInput).toHaveValue("+54 9 11 5555-6666");

    // Trigger blur on an invalid number
    fireEvent.change(phoneInput, { target: { value: "9999" } });
    fireEvent.blur(phoneInput);
    expect(screen.getByText(/formato incorrecto/i)).toBeInTheDocument();
  });

  it("should pre-populate prefix codes when clicking quick prefix chips", async () => {
    render(<VehicleDialog open={true} onOpenChange={vi.fn()} />);

    const createNewButton = screen.getByRole("button", { name: /crear nuevo/i });
    fireEvent.click(createNewButton);

    const phoneInput = screen.getByLabelText(/^teléfono\*?$/i);

    // Click "Rosario (341)" prefix chip
    const rosarioChip = screen.getByRole("button", { name: /341/i });
    fireEvent.click(rosarioChip);

    // Expect the input to contain the prefix template
    expect(phoneInput).toHaveValue("+54 9 341 ");

    // Now complete the number to trigger valid state
    fireEvent.change(phoneInput, { target: { value: "3415556666" } });
    expect(screen.getByText(/teléfono válido \(Rosario\)/i)).toBeInTheDocument();
  });

  it("should block inline customer creation if name is missing or phone is invalid", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "cust_123", name: "Juan Pérez" }),
    });
    global.fetch = mockFetch;

    render(<VehicleDialog open={true} onOpenChange={vi.fn()} />);

    const createNewButton = screen.getByRole("button", { name: /crear nuevo/i });
    fireEvent.click(createNewButton);

    const nameInput = screen.getByLabelText(/nombre/i);
    const phoneInput = screen.getByLabelText(/^teléfono\*?$/i);
    const submitButton = screen.getByRole("button", { name: /crear cliente/i });

    // Fill valid name, but invalid phone
    fireEvent.change(nameInput, { target: { value: "Juan Pérez" } });
    fireEvent.change(phoneInput, { target: { value: "111" } }); // Invalid length

    fireEvent.click(submitButton);

    // Fetch should not have been called, and error should be shown
    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByText(/formato incorrecto/i)).toBeInTheDocument();
  });

  it("should successfully create customer inline when phone is valid, and auto-select them", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "cust_123", name: "Juan Pérez" }),
    });
    global.fetch = mockFetch;

    render(<VehicleDialog open={true} onOpenChange={vi.fn()} />);

    const createNewButton = screen.getByRole("button", { name: /crear nuevo/i });
    fireEvent.click(createNewButton);

    const nameInput = screen.getByLabelText(/nombre/i);
    const phoneInput = screen.getByLabelText(/^teléfono\*?$/i);
    const submitButton = screen.getByRole("button", { name: /crear cliente/i });

    // Fill valid name and valid phone
    fireEvent.change(nameInput, { target: { value: "Juan Pérez" } });
    fireEvent.change(phoneInput, { target: { value: "3514445555" } }); // Córdoba (351)

    expect(screen.getByText(/teléfono válido \(Córdoba\)/i)).toBeInTheDocument();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/customers", expect.any(Object));
      expect(screen.getAllByText(/juan pérez/i).length).toBeGreaterThan(0);
    });
  });
});
