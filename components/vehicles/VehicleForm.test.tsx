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

// Mock plate-validation to always pass (we test form fields, not plate format)
vi.mock("@/lib/utils/plate-validation", () => ({
  validatePlate: () => true,
  getPlateFormatHint: () => "",
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

describe("VehicleForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
