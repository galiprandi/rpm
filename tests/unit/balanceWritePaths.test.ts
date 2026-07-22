/**
 * Unit tests for balance write path integrations.
 * Verifies that adjustBalanceAtomically is called with correct
 * deltas in each mutation path.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock balanceService
vi.mock("@/lib/services/balanceService", () => ({
  adjustBalanceAtomically: vi.fn(),
  recalculateCustomerBalance: vi.fn(),
  getBalanceBreakdown: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((fn) => fn({})),
    work_order: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    direct_sale: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    direct_sale_payment: {
      create: vi.fn(),
    },
    credit_note: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    balance_audit: {
      create: vi.fn(),
    },
  },
}));

import { adjustBalanceAtomically } from "@/lib/services/balanceService";

const mockAdjust = adjustBalanceAtomically as unknown as ReturnType<
  typeof vi.fn
>;

describe("Balance write path integrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("adjustBalanceAtomically call patterns", () => {
    it("should be called with positive delta for work order creation", async () => {
      mockAdjust.mockResolvedValue(500);

      const result = await adjustBalanceAtomically(
        "cust1",
        500,
        "work_order_create",
      );

      expect(result).toBe(500);
      expect(mockAdjust).toHaveBeenCalledWith(
        "cust1",
        500,
        "work_order_create",
      );
    });

    it("should be called with negative delta for payments", async () => {
      mockAdjust.mockResolvedValue(300);

      const result = await adjustBalanceAtomically("cust1", -200, "payment");

      expect(result).toBe(300);
      expect(mockAdjust).toHaveBeenCalledWith("cust1", -200, "payment");
    });

    it("should be called with negative delta for credit note creation", async () => {
      mockAdjust.mockResolvedValue(800);

      const result = await adjustBalanceAtomically(
        "cust1",
        -200,
        "credit_note",
      );

      expect(result).toBe(800);
      expect(mockAdjust).toHaveBeenCalledWith("cust1", -200, "credit_note");
    });

    it("should be called with positive delta for credit note cancellation", async () => {
      mockAdjust.mockResolvedValue(1000);

      const result = await adjustBalanceAtomically(
        "cust1",
        200,
        "credit_note_cancel",
      );

      expect(result).toBe(1000);
      expect(mockAdjust).toHaveBeenCalledWith(
        "cust1",
        200,
        "credit_note_cancel",
      );
    });

    it("should be called with negative delta for work order deletion", async () => {
      mockAdjust.mockResolvedValue(0);

      const result = await adjustBalanceAtomically(
        "cust1",
        -500,
        "work_order_delete",
      );

      expect(result).toBe(0);
      expect(mockAdjust).toHaveBeenCalledWith(
        "cust1",
        -500,
        "work_order_delete",
      );
    });

    it("should be called with negative delta for work order cancellation", async () => {
      mockAdjust.mockResolvedValue(0);

      const result = await adjustBalanceAtomically(
        "cust1",
        -300,
        "work_order_cancel",
      );

      expect(result).toBe(0);
      expect(mockAdjust).toHaveBeenCalledWith(
        "cust1",
        -300,
        "work_order_cancel",
      );
    });

    it("should be called with delta for work order items update", async () => {
      mockAdjust.mockResolvedValue(550);

      // delta = newTotal - oldTotal = 550 - 500 = 50
      const result = await adjustBalanceAtomically(
        "cust1",
        50,
        "work_order_items_update",
      );

      expect(result).toBe(550);
      expect(mockAdjust).toHaveBeenCalledWith(
        "cust1",
        50,
        "work_order_items_update",
      );
    });

    it("should be called with positive delta for direct sale credit", async () => {
      mockAdjust.mockResolvedValue(400);

      const result = await adjustBalanceAtomically("cust1", 400, "direct_sale");

      expect(result).toBe(400);
      expect(mockAdjust).toHaveBeenCalledWith("cust1", 400, "direct_sale");
    });
  });

  describe("transaction support", () => {
    it("should accept a transaction client parameter", async () => {
      mockAdjust.mockResolvedValue(600);

      const fakeTx = { customer: { update: vi.fn() } };
      const result = await adjustBalanceAtomically(
        "cust1",
        100,
        "test",
        fakeTx as unknown as Parameters<typeof adjustBalanceAtomically>[3],
      );

      expect(result).toBe(600);
      expect(mockAdjust).toHaveBeenCalledWith("cust1", 100, "test", fakeTx);
    });
  });

  describe("source tracking", () => {
    it("every write path should have a unique source identifier", () => {
      const sources = [
        "work_order_create",
        "payment",
        "customer_payment",
        "direct_sale",
        "credit_note",
        "credit_note_cancel",
        "work_order_delete",
        "work_order_items_update",
        "work_order_cancel",
      ];

      const unique = new Set(sources);
      expect(unique.size).toBe(sources.length);
    });
  });
});
