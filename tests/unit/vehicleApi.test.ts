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

// Mock prisma before importing route handlers
vi.mock("@/lib/prisma", () => ({
  prisma: {
    vehicle: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    vehicle_make: {
      upsert: vi.fn(),
    },
    vehicle_model: {
      upsert: vi.fn(),
    },
  },
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
    const { prisma } = await import("@/lib/prisma");
    const { POST } = await import("@/app/api/vehicles/route");

    // Mock resolveMakeModel upserts
    (prisma.vehicle_make.upsert as any).mockResolvedValue({
      id: "make-uuid",
      name: "Toyota",
      normalizedName: "toyota",
    });
    (prisma.vehicle_model.upsert as any).mockResolvedValue({
      id: "model-uuid",
      makeId: "make-uuid",
      name: "Hilux",
      normalizedName: "hilux",
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
      vehicle_make: { id: "make-uuid", name: "Toyota", normalizedName: "toyota" },
      vehicle_model: { id: "model-uuid", name: "Hilux", normalizedName: "hilux" },
      customer: { id: "customer-1", name: "Test", phone: "123" },
    };
    (prisma.vehicle.create as any).mockResolvedValue(createdVehicle);

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
    expect(data.vehicle_make.name).toBe("Toyota");
    expect(data.vehicle_model.name).toBe("Hilux");

    // Verify resolveMakeModel was called via upserts
    expect(prisma.vehicle_make.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { normalizedName: "toyota" },
        create: expect.objectContaining({ name: "Toyota", normalizedName: "toyota" }),
      }),
    );
    expect(prisma.vehicle_model.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { makeId_normalizedName: { makeId: "make-uuid", normalizedName: "hilux" } },
        create: expect.objectContaining({ name: "Hilux", normalizedName: "hilux" }),
      }),
    );

    // Verify vehicle.create was called with resolved IDs
    expect(prisma.vehicle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          identifier: "AB123CD",
          makeId: "make-uuid",
          modelId: "model-uuid",
          year: 2020,
          color: "Blanco",
        }),
      }),
    );
  });

  it("should create a vehicle without make/model (equipment)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { POST } = await import("@/app/api/vehicles/route");

    (prisma.vehicle.create as any).mockResolvedValue({
      id: "vehicle-uuid",
      identifier: "SN123456",
      category: "AUDIO_EQUIPMENT",
      makeId: null,
      modelId: null,
      equipmentName: "JBL Sound System",
      equipmentType: "Audio Profesional",
      customerId: "customer-1",
      vehicle_make: null,
      vehicle_model: null,
      customer: { id: "customer-1", name: "Test", phone: "123" },
    });

    const { status, data } = await getResponse(POST, makeRequest({
      identifier: "sn123456",
      category: "AUDIO_EQUIPMENT",
      customerId: "customer-1",
      equipmentName: "JBL Sound System",
      equipmentType: "Audio Profesional",
    }));

    expect(status).toBe(201);
    expect(data.equipmentName).toBe("JBL Sound System");
    expect(prisma.vehicle_make.upsert).not.toHaveBeenCalled();
    expect(prisma.vehicle_model.upsert).not.toHaveBeenCalled();
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
    const { prisma } = await import("@/lib/prisma");
    const { POST } = await import("@/app/api/vehicles/route");

    (prisma.vehicle.create as any).mockResolvedValue({
      id: "v-1",
      identifier: "AB123CD",
      category: "CAR",
      customerId: "c-1",
      vehicle_make: null,
      vehicle_model: null,
      customer: { id: "c-1", name: "T", phone: "1" },
    });

    await getResponse(POST, makeRequest({
      identifier: "ab123cd",
      category: "CAR",
      customerId: "c-1",
    }));

    expect(prisma.vehicle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ identifier: "AB123CD" }),
      }),
    );
  });
});

describe("PUT /api/vehicles/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update vehicle and resolve makeName/modelName to IDs", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { PUT } = await import("@/app/api/vehicles/[id]/route");

    (prisma.vehicle_make.upsert as any).mockResolvedValue({
      id: "make-2",
      name: "Fiat",
      normalizedName: "fiat",
    });
    (prisma.vehicle_model.upsert as any).mockResolvedValue({
      id: "model-2",
      makeId: "make-2",
      name: "Cronos",
      normalizedName: "cronos",
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
      vehicle_make: { id: "make-2", name: "Fiat", normalizedName: "fiat" },
      vehicle_model: { id: "model-2", name: "Cronos", normalizedName: "cronos" },
      customer: { id: "customer-1", name: "Test", phone: "123" },
    };
    (prisma.vehicle.update as any).mockResolvedValue(updatedVehicle);

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
    expect(data.vehicle_make.name).toBe("Fiat");
    expect(data.vehicle_model.name).toBe("Cronos");

    // Verify update was called with resolved IDs
    expect(prisma.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "vehicle-uuid" },
        data: expect.objectContaining({
          identifier: "AF719HZ",
          makeId: "make-2",
          modelId: "model-2",
          color: "Blanco",
        }),
      }),
    );
  });

  it("should update vehicle without make/model (clearing them)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { PUT } = await import("@/app/api/vehicles/[id]/route");

    (prisma.vehicle.update as any).mockResolvedValue({
      id: "vehicle-uuid",
      identifier: "SN999",
      category: "OTHER",
      makeId: null,
      modelId: null,
      equipmentName: "Updated Equipment",
      customerId: "c-1",
      vehicle_make: null,
      vehicle_model: null,
      customer: { id: "c-1", name: "T", phone: "1" },
    });

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
    expect(prisma.vehicle_make.upsert).not.toHaveBeenCalled();
  });
});
