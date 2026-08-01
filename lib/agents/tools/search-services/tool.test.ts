import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchServicesTool } from "./tool";

const { mockDb } = vi.hoisted(() => {
  const query = {
    service: { findMany: vi.fn() },
  };

  const mockDb = {
    query,
  };

  return { mockDb };
});

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

describe("searchServicesTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return message when no services are found", async () => {
    mockDb.query.service.findMany.mockResolvedValueOnce([]);

    const result = await searchServicesTool.execute({ search: "alineacion", limit: 10 }, {} as any);

    expect(result).toBe("No se encontraron servicios con ese criterio de búsqueda.");
    expect(mockDb.query.service.findMany).toHaveBeenCalled();
  });

  it("should return formatted list of services when matching services are found", async () => {
    mockDb.query.service.findMany.mockResolvedValueOnce([
      {
        id: "s-1",
        name: "Alineación y Balanceo",
        description: "Alineación delantera y balanceo de 4 ruedas",
        baseCost: "5500.00",
        timeMinutes: 45,
        isActive: true,
      },
      {
        id: "s-2",
        name: "Instalación Bi-LED",
        description: null,
        baseCost: "12000.00",
        timeMinutes: 120,
        isActive: true,
      },
    ]);

    const result = await searchServicesTool.execute({ search: "led", limit: 10 }, {} as any);

    expect(result).toContain("Se encontraron 2 servicio(s):");
    expect(result).toContain("Alineación y Balanceo");
    expect(result).toContain("📝 Alineación delantera y balanceo de 4 ruedas");
    expect(result).toContain("💵 Costo Base: $5.500");
    expect(result).toContain("⏱️ Duración: 45 minutos");
    expect(result).toContain("Instalación Bi-LED");
    expect(result).not.toContain("📝 null");
    expect(result).toContain("💵 Costo Base: $12.000");
    expect(result).toContain("⏱️ Duración: 120 minutos");
  });
});
