/**
 * Unit tests for balanceService — centralized balance logic.
 * Tests recalculateCustomerBalance, adjustBalanceAtomically, and edge cases.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((fn) => fn({})),
    work_order: {
      findMany: vi.fn(),
    },
    direct_sale: {
      findMany: vi.fn(),
    },
    credit_note: {
      findMany: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    balance_audit: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  recalculateCustomerBalance,
  adjustBalanceAtomically,
  getBalanceBreakdown,
} from "@/lib/services/balanceService";

const mockPrisma = prisma as unknown as {
  work_order: { findMany: ReturnType<typeof vi.fn> };
  direct_sale: { findMany: ReturnType<typeof vi.fn> };
  credit_note: { findMany: ReturnType<typeof vi.fn> };
  customer: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  balance_audit: { create: ReturnType<typeof vi.fn> };
};

describe("balanceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("recalculateCustomerBalance", () => {
    it("should calculate balance from work orders only when no direct sales or credit notes", async () => {
      mockPrisma.work_order.findMany.mockResolvedValue([
        { id: "wo1", total: 100, payments: [{ amount: 30 }] },
        { id: "wo2", total: 200, payments: [] },
      ]);
      mockPrisma.direct_sale.findMany.mockResolvedValue([]);
      mockPrisma.credit_note.findMany.mockResolvedValue([]);
      mockPrisma.customer.findUnique.mockResolvedValue({ balance: 270 });
      mockPrisma.customer.update.mockResolvedValue({ balance: 270 });
      mockPrisma.balance_audit.create.mockResolvedValue({});

      const result = await recalculateCustomerBalance("cust1");

      // (100 - 30) + (200 - 0) = 270
      expect(result).toBe(270);
    });

    it("should include direct sales debt in calculation", async () => {
      mockPrisma.work_order.findMany.mockResolvedValue([
        { id: "wo1", total: 500, payments: [{ amount: 200 }] },
      ]);
      mockPrisma.direct_sale.findMany.mockResolvedValue([
        { id: "ds1", total: 300, payments: [{ amount: 100 }] },
      ]);
      mockPrisma.credit_note.findMany.mockResolvedValue([]);
      mockPrisma.customer.findUnique.mockResolvedValue({ balance: 500 });
      mockPrisma.customer.update.mockResolvedValue({ balance: 500 });
      mockPrisma.balance_audit.create.mockResolvedValue({});

      const result = await recalculateCustomerBalance("cust1");

      // (500 - 200) + (300 - 100) = 500
      expect(result).toBe(500);
    });

    it("should subtract credit notes from balance", async () => {
      mockPrisma.work_order.findMany.mockResolvedValue([
        { id: "wo1", total: 1000, payments: [] },
      ]);
      mockPrisma.direct_sale.findMany.mockResolvedValue([]);
      mockPrisma.credit_note.findMany.mockResolvedValue([
        { total: 200 },
        { total: 100 },
      ]);
      mockPrisma.customer.findUnique.mockResolvedValue({ balance: 700 });
      mockPrisma.customer.update.mockResolvedValue({ balance: 700 });
      mockPrisma.balance_audit.create.mockResolvedValue({});

      const result = await recalculateCustomerBalance("cust1");

      // 1000 - 0 - (200 + 100) = 700
      expect(result).toBe(700);
    });

    it("should exclude CANCELLED work orders", async () => {
      mockPrisma.work_order.findMany.mockResolvedValue([
        { id: "wo1", total: 500, payments: [] },
      ]);
      mockPrisma.direct_sale.findMany.mockResolvedValue([]);
      mockPrisma.credit_note.findMany.mockResolvedValue([]);
      mockPrisma.customer.findUnique.mockResolvedValue({ balance: 500 });
      mockPrisma.customer.update.mockResolvedValue({ balance: 500 });
      mockPrisma.balance_audit.create.mockResolvedValue({});

      const result = await recalculateCustomerBalance("cust1");

      expect(result).toBe(500);
      expect(mockPrisma.work_order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { notIn: ["CANCELLED"] },
          }),
        }),
      );
    });

    it("should log to balance_audit when stored balance differs from calculated", async () => {
      mockPrisma.work_order.findMany.mockResolvedValue([
        { id: "wo1", total: 100, payments: [] },
      ]);
      mockPrisma.direct_sale.findMany.mockResolvedValue([]);
      mockPrisma.credit_note.findMany.mockResolvedValue([]);
      mockPrisma.customer.findUnique.mockResolvedValue({ balance: 200 }); // drift of 100
      mockPrisma.customer.update.mockResolvedValue({ balance: 100 });
      mockPrisma.balance_audit.create.mockResolvedValue({});

      const result = await recalculateCustomerBalance("cust1");

      expect(result).toBe(100);
      expect(mockPrisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "cust1" },
          data: { balance: 100 },
        }),
      );
      expect(mockPrisma.balance_audit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: "cust1",
            oldBalance: 200,
            newBalance: 100,
            driftAmount: 100,
            source: "recalculate",
          }),
        }),
      );
    });

    it("should NOT log to balance_audit when balance matches", async () => {
      mockPrisma.work_order.findMany.mockResolvedValue([
        { id: "wo1", total: 100, payments: [] },
      ]);
      mockPrisma.direct_sale.findMany.mockResolvedValue([]);
      mockPrisma.credit_note.findMany.mockResolvedValue([]);
      mockPrisma.customer.findUnique.mockResolvedValue({ balance: 100 });
      mockPrisma.customer.update.mockResolvedValue({ balance: 100 });
      mockPrisma.balance_audit.create.mockResolvedValue({});

      const result = await recalculateCustomerBalance("cust1");

      expect(result).toBe(100);
      expect(mockPrisma.balance_audit.create).not.toHaveBeenCalled();
    });

    it("should handle customer with no work orders, direct sales, or credit notes", async () => {
      mockPrisma.work_order.findMany.mockResolvedValue([]);
      mockPrisma.direct_sale.findMany.mockResolvedValue([]);
      mockPrisma.credit_note.findMany.mockResolvedValue([]);
      mockPrisma.customer.findUnique.mockResolvedValue({ balance: 0 });
      mockPrisma.customer.update.mockResolvedValue({ balance: 0 });
      mockPrisma.balance_audit.create.mockResolvedValue({});

      const result = await recalculateCustomerBalance("cust1");

      expect(result).toBe(0);
    });
  });

  describe("adjustBalanceAtomically", () => {
    it("should increment balance by delta and create audit log", async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({ balance: 100 });
      mockPrisma.customer.update.mockResolvedValue({ balance: 150 });
      mockPrisma.balance_audit.create.mockResolvedValue({});

      const result = await adjustBalanceAtomically(
        "cust1",
        50,
        "work_order_create",
      );

      expect(result).toBe(150);
      expect(mockPrisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "cust1" },
          data: { balance: { increment: 50 } },
        }),
      );
      expect(mockPrisma.balance_audit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: "cust1",
            oldBalance: 100,
            newBalance: 150,
            source: "work_order_create",
          }),
        }),
      );
    });

    it("should handle negative delta (payments)", async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({ balance: 500 });
      mockPrisma.customer.update.mockResolvedValue({ balance: 300 });
      mockPrisma.balance_audit.create.mockResolvedValue({});

      const result = await adjustBalanceAtomically("cust1", -200, "payment");

      expect(result).toBe(300);
      expect(mockPrisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { balance: { increment: -200 } },
        }),
      );
    });

    it("should throw if customer not found", async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      await expect(
        adjustBalanceAtomically("nonexistent", 100, "test"),
      ).rejects.toThrow("Customer not found: nonexistent");
    });
  });

  describe("getBalanceBreakdown", () => {
    it("should return detailed breakdown of debts", async () => {
      mockPrisma.work_order.findMany.mockResolvedValue([
        { id: "wo1", total: 500, payments: [{ amount: 200 }] },
        { id: "wo2", total: 300, payments: [{ amount: 300 }] },
      ]);
      mockPrisma.direct_sale.findMany.mockResolvedValue([
        { id: "ds1", total: 400, payments: [{ amount: 100 }] },
      ]);
      mockPrisma.credit_note.findMany.mockResolvedValue([
        { total: 150 },
      ]);

      const result = await getBalanceBreakdown("cust1");

      // workOrderDebt = (500-200) + (300-300) = 300
      // directSaleDebt = 400-100 = 300
      // creditNoteCredit = 150
      // balance = 300 + 300 - 150 = 450
      expect(result.workOrderDebt).toBe(300);
      expect(result.directSaleDebt).toBe(300);
      expect(result.creditNoteCredit).toBe(150);
      expect(result.balance).toBe(450);
      expect(result.workOrderCount).toBe(2);
      expect(result.directSaleCount).toBe(1);
    });
  });
});
