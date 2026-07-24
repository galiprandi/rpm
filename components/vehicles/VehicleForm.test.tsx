/**
 * Unit tests for VehicleForm component.
 *
 * Verifies that the form:
 * - Renders all expected fields (identifier, category, makeName, modelName, year, color)
 * - Submits data with the correct field names matching VehicleFormData interface
 * - Populates initialData when provided
 * - Upper-cases the identifier on submit
 *
 * Related specs: /specs/customers.md, /specs/workshop.md
 * Coverage: form submission + field mapping + initial data
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import type { VehicleFormData } from "@/lib/types/vehicle";

const mockValidatePlate = vi.fn<(plate: string) => boolean>(() => true);
const mockGetPlateFormatHint = vi.fn<(category: string) => string>(() => "Ej: ABC123");

// Mock plate-validation
vi.mock("@/lib/utils/plate-validation", () => ({
  validatePlate: (plate: string) => mockValidatePlate(plate),
  getPlateFormatHint: (category: string) => mockGetPlateFormatHint(category),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

describe("VehicleForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidatePlate.mockReturnValue(true);
    mockGetPlateFormatHint.mockReturnValue("Ej: ABC123");
  });

  it("should submit with all correct VehicleFormData fields for a car", async () => {
    const onSubmit = vi.fn();
    render(<VehicleForm onSubmit={onSubmit} />);

    // Fill identifier
    const identifierInput = screen.getByLabelText(/patente/i);
    fireEvent.change(identifierInput, { target: { value: "ab123cd" } });

    // Fill makeName
    const makeInput = screen.getByLabelText(/marca/i);
    fireEvent.change(makeInput, { target: { value: "Toyota" } });

    // Fill modelName
    const modelInput = screen.getByLabelText(/modelo/i);
    fireEvent.change(modelInput, { target: { value: "Hilux" } });

    // Fill year
    const yearInput = screen.getByLabelText(/año/i);
    fireEvent.change(yearInput, { target: { value: "2020" } });

    // Fill color
    const colorInput = screen.getByLabelText(/color/i);
    fireEvent.change(colorInput, { target: { value: "Blanco" } });

    // Submit
    const submitButton = screen.getByRole("button", {
      name: /guardar vehículo/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = onSubmit.mock.calls[0][0] as VehicleFormData;

    // Verify all expected fields are present with correct values
    expect(submitted.identifier).toBe("AB123CD"); // should be uppercased
    expect(submitted.category).toBe("CAR"); // default category
    expect(submitted.makeName).toBe("Toyota");
    expect(submitted.modelName).toBe("Hilux");
    expect(submitted.year).toBe("2020");
    expect(submitted.color).toBe("Blanco");

    // Verify no unexpected fields
    expect(Object.keys(submitted).sort()).toEqual(
      [
        "identifier",
        "category",
        "makeName",
        "modelName",
        "year",
        "color",
        "equipmentName",
        "equipmentType",
        "description",
        "notes",
      ].sort(),
    );
  });

  it("should populate fields from initialData", async () => {
    const onSubmit = vi.fn();
    render(
      <VehicleForm
        onSubmit={onSubmit}
        initialData={{
          identifier: "AF719HZ",
          category: "CAR",
          makeName: "Fiat",
          modelName: "Cronos",
          year: "2022",
          color: "Blanco",
        }}
      />,
    );

    // Verify fields are pre-populated
    const identifierInput = screen.getByDisplayValue("AF719HZ");
    expect(identifierInput).toBeInTheDocument();

    const makeInput = screen.getByDisplayValue("Fiat");
    expect(makeInput).toBeInTheDocument();

    const modelInput = screen.getByDisplayValue("Cronos");
    expect(modelInput).toBeInTheDocument();

    // Submit without changes
    const submitButton = screen.getByRole("button", {
      name: /guardar vehículo/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = onSubmit.mock.calls[0][0] as VehicleFormData;
    expect(submitted.identifier).toBe("AF719HZ");
    expect(submitted.makeName).toBe("Fiat");
    expect(submitted.modelName).toBe("Cronos");
    expect(submitted.year).toBe("2022");
    expect(submitted.color).toBe("Blanco");
  });

  it("should show equipment fields when category is OTHER", async () => {
    const onSubmit = vi.fn();
    render(
      <VehicleForm onSubmit={onSubmit} initialData={{ category: "OTHER" }} />,
    );

    // Equipment-specific fields should be visible
    expect(screen.getByLabelText(/nombre del equipo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de equipo/i)).toBeInTheDocument();

    // Vehicle-specific fields should NOT be visible
    expect(screen.queryByLabelText(/marca/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/modelo/i)).not.toBeInTheDocument();
  });

  it("should uppercase identifier on input", async () => {
    const onSubmit = vi.fn();
    render(<VehicleForm onSubmit={onSubmit} />);

    const identifierInput = screen.getByLabelText(/patente/i);
    fireEvent.change(identifierInput, { target: { value: "xyz789" } });

    expect(identifierInput).toHaveValue("XYZ789");
  });

  it("should include notes in submission", async () => {
    const onSubmit = vi.fn();
    render(
      <VehicleForm
        onSubmit={onSubmit}
        initialData={{ identifier: "AB123CD" }}
      />,
    );

    const notesInput = screen.getByLabelText(/notas/i);
    fireEvent.change(notesInput, { target: { value: "Nota de prueba" } });

    const submitButton = screen.getByRole("button", {
      name: /guardar vehículo/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = onSubmit.mock.calls[0][0] as VehicleFormData;
    expect(submitted.notes).toBe("Nota de prueba");
  });

  it("should validate plate in real-time when expected length is reached", async () => {
    const onSubmit = vi.fn();
    mockValidatePlate.mockReturnValue(true);
    render(<VehicleForm onSubmit={onSubmit} />);

    const identifierInput = screen.getByLabelText(/patente/i);

    // Try a partial length plate
    fireEvent.change(identifierInput, { target: { value: "ab123" } });
    expect(screen.queryByText(/patente válida/i)).not.toBeInTheDocument();

    // Fill to expected length (7 characters for CAR category)
    fireEvent.change(identifierInput, { target: { value: "ab123cd" } });
    expect(screen.getByText(/patente válida/i)).toBeInTheDocument();
    expect(identifierInput).toHaveClass("border-emerald-500");
  });

  it("should validate onBlur and show error if plate is too short", async () => {
    const onSubmit = vi.fn();
    mockValidatePlate.mockReturnValue(false);
    render(<VehicleForm onSubmit={onSubmit} />);

    const identifierInput = screen.getByLabelText(/patente/i);
    fireEvent.change(identifierInput, { target: { value: "ab123" } });

    // Trigger blur
    fireEvent.blur(identifierInput);

    expect(screen.getByText(/la patente es demasiado corta/i)).toBeInTheDocument();
    expect(identifierInput).toHaveClass("border-destructive");
    expect(screen.queryByText(/patente válida/i)).not.toBeInTheDocument();
  });

  it("should validate onBlur and show custom error format description if invalid length is met", async () => {
    const onSubmit = vi.fn();
    mockValidatePlate.mockReturnValue(false);
    mockGetPlateFormatHint.mockReturnValue("Ej: ABC123");
    render(<VehicleForm onSubmit={onSubmit} />);

    const identifierInput = screen.getByLabelText(/patente/i);
    fireEvent.change(identifierInput, { target: { value: "ab12345" } });

    // Trigger blur
    fireEvent.blur(identifierInput);

    expect(
      screen.getByText(/formato de patente inválido para argentina\. ej: abc123/i)
    ).toBeInTheDocument();
    expect(identifierInput).toHaveClass("border-destructive");
  });

  it("should block form submission and show error if plate is invalid", async () => {
    const onSubmit = vi.fn();
    mockValidatePlate.mockReturnValue(false);
    render(<VehicleForm onSubmit={onSubmit} />);

    const identifierInput = screen.getByLabelText(/patente/i);
    fireEvent.change(identifierInput, { target: { value: "invalid-plate" } });

    const submitButton = screen.getByRole("button", {
      name: /guardar vehículo/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });

    expect(
      screen.getByText(/formato de patente inválido para argentina/i)
    ).toBeInTheDocument();
  });
});
