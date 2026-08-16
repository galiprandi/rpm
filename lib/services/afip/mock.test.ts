/**
 * Mock AFIP Service Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MockAfipService } from "./mock";

// Mock dependencies
const mockSettings = new Map<string, string>();

vi.mock("../settingsService", () => ({
  getSetting: vi.fn((key: string) =>
    Promise.resolve(mockSettings.get(key) ?? ""),
  ),
}));

vi.mock("../../db", () => ({
  db: {
    query: {
      invoice: {
        findFirst: vi.fn(() => Promise.resolve(null)),
      },
    },
  },
}));

describe("MockAfipService", () => {
  let service: MockAfipService;

  beforeEach(() => {
    service = new MockAfipService();
    mockSettings.clear();
    mockSettings.set("AFIP_CUIT", "30123456789");
    mockSettings.set("AFIP_PUNTO_VENTA", "1");
    mockSettings.set("AFIP_PRODUCTION", "false");
    vi.clearAllMocks();
  });

  it("checkConnection returns success when CUIT and PV are configured", async () => {
    const result = await service.checkConnection();
    expect(result.success).toBe(true);
  });

  it("checkConnection fails when CUIT is missing", async () => {
    mockSettings.delete("AFIP_CUIT");
    const result = await service.checkConnection();
    expect(result.success).toBe(false);
    expect(result.error).toContain("CUIT");
  });

  it("checkConnection fails when PV is missing", async () => {
    mockSettings.delete("AFIP_PUNTO_VENTA");
    const result = await service.checkConnection();
    expect(result.success).toBe(false);
    expect(result.error).toContain("Punto de Venta");
  });

  it("requestCAE returns a mock CAE on success", async () => {
    const result = await service.requestCAE({
      tipo: 1,
      puntoVenta: 1,
      customerDoc: "30123456789",
      customerDocType: "CUIT",
      total: 1210,
      neto: 1000,
      iva21: 210,
      iva105: 0,
      concepto: 1,
      cbteFch: "20240115",
      docTipo: 80,
      docNro: 30123456789,
    });

    expect(result.success).toBe(true);
    expect(result.resultado).toBe("A");
    expect(result.cae).toBeTruthy();
    expect(result.caeVencimiento).toBeInstanceOf(Date);
    expect(result.numeroOficial).toMatch(/^\d{4}-\d{8}$/);
  });

  it("requestCAE fails when settings are incomplete", async () => {
    mockSettings.delete("AFIP_CUIT");
    const result = await service.requestCAE({
      tipo: 1,
      puntoVenta: 1,
      customerDoc: "30123456789",
      customerDocType: "CUIT",
      total: 1210,
      neto: 1000,
      iva21: 210,
      iva105: 0,
      concepto: 1,
      cbteFch: "20240115",
      docTipo: 80,
      docNro: 30123456789,
    });

    expect(result.success).toBe(false);
    expect(result.resultado).toBe("R");
  });

  it("requestCAE includes homologation note when not in production", async () => {
    const result = await service.requestCAE({
      tipo: 1,
      puntoVenta: 1,
      customerDoc: "30123456789",
      customerDocType: "CUIT",
      total: 1210,
      neto: 1000,
      iva21: 210,
      iva105: 0,
      concepto: 1,
      cbteFch: "20240115",
      docTipo: 80,
      docNro: 30123456789,
    });

    expect(result.observaciones?.some((o) => o.includes("HOMOLOGACIÓN"))).toBe(true);
  });

  it("consultVoucher returns not found in mock mode", async () => {
    const result = await service.consultVoucher(1, 1, 1);
    expect(result.success).toBe(false);
    expect(result.resultado).toBe("R");
  });
});
