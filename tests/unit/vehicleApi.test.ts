/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Integration tests for Vehicle API endpoints.
 *
 * Validates that POST /api/vehicles and PUT /api/vehicles/[id]
 * correctly persist form data (makeName/modelName) by resolving
 * them to vehicle_make/vehicle_model IDs via resolveMakeModel.
 *
 * Related specs: /specs/customers.md, /specs/workshop.md
 * Coverage: happy path + validation errors + make/model resolution
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock resolveMakeModel to avoid complex Drizzle chain mocking
vi.mock("@/lib/utils/vehicle-helpers", () => ({
  resolveMakeModel: vi.fn(),
}));

// Mock db (Drizzle) before importing route handlers
const { mockDb } = vi.hoisted(() => {
  const mockDb = {
    query: {
      vehicle: { findFirst: vi.fn() },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{}])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  };
  return { mockDb };
});

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/auth-server", () => ({
  getSession: vi.fn().mockResolvedValue({
    user: { id: "user-1", name: "Admin", role: "ADMIN" },
  }),
}));

vi.mock("@/lib/utils/format", () => ({
  capitalizeText: (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(),
}));

// Helper to create mock NextRequest
function makeRequest(body: unknown) {
  return {
    json: async () => body,
    nextUrl: new URL("http://localhost/api/vehicles"),
  } as any;
}

// Helper to extract response from route handler
async function getResponse(handler: any, req: any, params?: any) {
  const res = await handler(req, { params: Promise.resolve(params || {}) });
  return { status: res.status, data: await res.json() };
}

describe("POST /api/vehicles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a vehicle with makeName/modelName and resolve to IDs", async () => {
    const { resolveMakeModel } = await import("@/lib/utils/vehicle-helpers");
    const { db } = await import("@/lib/db");
    const { POST } = await import("@/app/api/vehicles/route");

    // Mock resolveMakeModel to return resolved IDs
    (resolveMakeModel as any).mockResolvedValue({
      makeId: "make-uuid",
      modelId: "model-uuid",
    });

    const createdVehicle = {
      id: "vehicle-uuid",
      identifier: "AB123CD",
      category: "CAR",
      makeId: "make-uuid",
      modelId: "model-uuid",
      year: 2020,
      color: "Blanco",
      customerId: "customer-1",
      vehicleMake: { id: "make-uuid", name: "Toyota", normalizedName: "toyota" },
      vehicleModel: { id: "model-uuid", name: "Hilux", normalizedName: "hilux" },
      customer: { id: "customer-1", name: "Test", phone: "123" },
    };

    // Mock db.insert(vehicle).values({...}).returning() to return created vehicle
    const returningFn = vi.fn(() => Promise.resolve([createdVehicle]));
    const valuesFn = vi.fn(() => ({ returning: returningFn }));
    (db.insert as any).mockReturnValue({ values: valuesFn });

    // Mock db.query.vehicle.findFirst to return vehicle with relations
    (db.query.vehicle.findFirst as any).mockResolvedValue(createdVehicle);

    const { status, data } = await getResponse(POST, makeRequest({
      identifier: "ab123cd",
      category: "CAR",
      customerId: "customer-1",
      makeName: "toyota",
      modelName: "hilux",
      year: 2020,
      color: "blanco",
    }));

    expect(status).toBe(201);
    expect(data.id).toBe("vehicle-uuid");
    expect(data.vehicleMake.name).toBe("Toyota");
    expect(data.vehicleModel.name).toBe("Hilux");

    // Verify resolveMakeModel was called with makeName and modelName
    expect(resolveMakeModel).toHaveBeenCalledWith("toyota", "hilux");

    // Verify db.insert was called and values received the correct data
    expect(db.insert).toHaveBeenCalled();
    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "AB123CD",
        makeId: "make-uuid",
        modelId: "model-uuid",
        year: 2020,
        color: "Blanco",
      }),
    );
  });

  it("should create a vehicle without make/model (equipment)", async () => {
    const { resolveMakeModel } = await import("@/lib/utils/vehicle-helpers");
    const { db } = await import("@/lib/db");
    const { POST } = await import("@/app/api/vehicles/route");

    const createdVehicle = {
      id: "vehicle-uuid",
      identifier: "SN123456",
      category: "AUDIO_EQUIPMENT",
      makeId: null,
      modelId: null,
      equipmentName: "JBL Sound System",
      equipmentType: "Audio Profesional",
      customerId: "customer-1",
      vehicleMake: null,
      vehicleModel: null,
      customer: { id: "customer-1", name: "Test", phone: "123" },
    };

    const returningFn = vi.fn(() => Promise.resolve([createdVehicle]));
    const valuesFn = vi.fn(() => ({ returning: returningFn }));
    (db.insert as any).mockReturnValue({ values: valuesFn });
    (db.query.vehicle.findFirst as any).mockResolvedValue(createdVehicle);

    const { status, data } = await getResponse(POST, makeRequest({
      identifier: "sn123456",
      category: "AUDIO_EQUIPMENT",
      customerId: "customer-1",
      equipmentName: "JBL Sound System",
      equipmentType: "Audio Profesional",
    }));

    expect(status).toBe(201);
    expect(data.equipmentName).toBe("JBL Sound System");
    // resolveMakeModel should not be called when no makeName is provided
    expect(resolveMakeModel).not.toHaveBeenCalled();
  });

  it("should reject missing required fields", async () => {
    const { POST } = await import("@/app/api/vehicles/route");

    const { status, data } = await getResponse(POST, makeRequest({
      identifier: "AB123CD",
      // missing category and customerId
    }));

    expect(status).toBe(400);
    expect(data.error).toContain("Missing required fields");
  });

  it("should reject invalid category", async () => {
    const { POST } = await import("@/app/api/vehicles/route");

    const { status, data } = await getResponse(POST, makeRequest({
      identifier: "AB123CD",
      category: "INVALID",
      customerId: "customer-1",
    }));

    expect(status).toBe(400);
    expect(data.error).toContain("Invalid category");
  });

  it("should uppercase the identifier", async () => {
    const { resolveMakeModel } = await import("@/lib/utils/vehicle-helpers");
    const { db } = await import("@/lib/db");
    const { POST } = await import("@/app/api/vehicles/route");

    (resolveMakeModel as any).mockResolvedValue({ makeId: undefined, modelId: undefined });

    const createdVehicle = {
      id: "v-1",
      identifier: "AB123CD",
      category: "CAR",
      customerId: "c-1",
      vehicleMake: null,
      vehicleModel: null,
      customer: { id: "c-1", name: "T", phone: "1" },
    };

    const returningFn = vi.fn(() => Promise.resolve([createdVehicle]));
    const valuesFn = vi.fn(() => ({ returning: returningFn }));
    (db.insert as any).mockReturnValue({ values: valuesFn });
    (db.query.vehicle.findFirst as any).mockResolvedValue(createdVehicle);

    await getResponse(POST, makeRequest({
      identifier: "ab123cd",
      category: "CAR",
      customerId: "c-1",
    }));

    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "AB123CD" }),
    );
  });
});

describe("PUT /api/vehicles/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update vehicle and resolve makeName/modelName to IDs", async () => {
    const { resolveMakeModel } = await import("@/lib/utils/vehicle-helpers");
    const { db } = await import("@/lib/db");
    const { PUT } = await import("@/app/api/vehicles/[id]/route");

    (resolveMakeModel as any).mockResolvedValue({
      makeId: "make-2",
      modelId: "model-2",
    });

    const updatedVehicle = {
      id: "vehicle-uuid",
      identifier: "AF719HZ",
      category: "CAR",
      makeId: "make-2",
      modelId: "model-2",
      year: 2022,
      color: "Blanco",
      customerId: "customer-1",
      vehicleMake: { id: "make-2", name: "Fiat", normalizedName: "fiat" },
      vehicleModel: { id: "model-2", name: "Cronos", normalizedName: "cronos" },
      customer: { id: "customer-1", name: "Test", phone: "123" },
    };

    // Mock update chain
    const whereFn = vi.fn(() => Promise.resolve());
    const setFn = vi.fn(() => ({ where: whereFn }));
    (db.update as any).mockReturnValue({ set: setFn });

    // Mock findFirst to return updated vehicle with relations
    (db.query.vehicle.findFirst as any).mockResolvedValue(updatedVehicle);

    const { status, data } = await getResponse(
      PUT,
      makeRequest({
        identifier: "af719hz",
        category: "CAR",
        makeName: "fiat",
        modelName: "cronos",
        year: 2022,
        color: "blanco",
      }),
      { id: "vehicle-uuid" },
    );

    expect(status).toBe(200);
    expect(data.vehicleMake.name).toBe("Fiat");
    expect(data.vehicleModel.name).toBe("Cronos");

    // Verify update was called with resolved IDs
    expect(db.update).toHaveBeenCalled();
    expect(setFn).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "AF719HZ",
        makeId: "make-2",
        modelId: "model-2",
        color: "Blanco",
      }),
    );
  });

  it("should update vehicle without make/model (clearing them)", async () => {
    const { resolveMakeModel } = await import("@/lib/utils/vehicle-helpers");
    const { db } = await import("@/lib/db");
    const { PUT } = await import("@/app/api/vehicles/[id]/route");

    const updatedVehicle = {
      id: "vehicle-uuid",
      identifier: "SN999",
      category: "OTHER",
      makeId: null,
      modelId: null,
      equipmentName: "Updated Equipment",
      customerId: "c-1",
      vehicleMake: null,
      vehicleModel: null,
      customer: { id: "c-1", name: "T", phone: "1" },
    };

    const whereFn = vi.fn(() => Promise.resolve());
    const setFn = vi.fn(() => ({ where: whereFn }));
    (db.update as any).mockReturnValue({ set: setFn });
    (db.query.vehicle.findFirst as any).mockResolvedValue(updatedVehicle);

    const { status, data } = await getResponse(
      PUT,
      makeRequest({
        identifier: "sn999",
        category: "OTHER",
        equipmentName: "Updated Equipment",
      }),
      { id: "vehicle-uuid" },
    );

    expect(status).toBe(200);
    expect(data.equipmentName).toBe("Updated Equipment");
    // resolveMakeModel should not be called when no makeName is provided
    expect(resolveMakeModel).not.toHaveBeenCalled();
  });
});
