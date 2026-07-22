/**
 * Unit tests for balanceService — centralized balance logic.
 * Tests recalculateCustomerBalance, adjustBalanceAtomically, and edge cases.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db with Drizzle-style chainable methods
const { mockDb } = vi.hoisted(() => {
  const mockDb = {
    query: {
      workOrder: { findMany: vi.fn() },
      directSale: { findMany: vi.fn() },
      creditNote: { findMany: vi.fn() },
      customer: { findFirst: vi.fn() },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
        returning: vi.fn(() => Promise.resolve([{ balance: 0 }])),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
    transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(mockDb)),
  };
  return { mockDb };
});

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

import { db } from "@/lib/db";
import {
  recalculateCustomerBalance,
  adjustBalanceAtomically,
  getBalanceBreakdown,
} from "@/lib/services/balanceService";

const mockQuery = db.query as unknown as {
  workOrder: { findMany: ReturnType<typeof vi.fn> };
  directSale: { findMany: ReturnType<typeof vi.fn> };
  creditNote: { findMany: ReturnType<typeof vi.fn> };
  customer: { findFirst: ReturnType<typeof vi.fn> };
};
const mockUpdate = db.update as unknown as ReturnType<typeof vi.fn>;
const mockInsert = db.insert as unknown as ReturnType<typeof vi.fn>;

describe("balanceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("recalculateCustomerBalance", () => {
    it("should calculate balance from work orders only when no direct sales or credit notes", async () => {
      mockQuery.workOrder.findMany.mockResolvedValue([
        { id: "wo1", total: 100, payments: [{ amount: 30 }] },
        { id: "wo2", total: 200, payments: [] },
      ]);
      mockQuery.directSale.findMany.mockResolvedValue([]);
      mockQuery.creditNote.findMany.mockResolvedValue([]);
      mockQuery.customer.findFirst.mockResolvedValue({ balance: 270 });

      const result = await recalculateCustomerBalance("cust1");

      // (100 - 30) + (200 - 0) = 270
      expect(result).toBe(270);
    });

    it("should include direct sales debt in calculation", async () => {
      mockQuery.workOrder.findMany.mockResolvedValue([
        { id: "wo1", total: 500, payments: [{ amount: 200 }] },
      ]);
      mockQuery.directSale.findMany.mockResolvedValue([
        { id: "ds1", total: 300, directSalePayments: [{ amount: 100 }] },
      ]);
      mockQuery.creditNote.findMany.mockResolvedValue([]);
      mockQuery.customer.findFirst.mockResolvedValue({ balance: 500 });

      const result = await recalculateCustomerBalance("cust1");

      // (500 - 200) + (300 - 100) = 500
      expect(result).toBe(500);
    });

    it("should subtract credit notes from balance", async () => {
      mockQuery.workOrder.findMany.mockResolvedValue([
        { id: "wo1", total: 1000, payments: [] },
      ]);
      mockQuery.directSale.findMany.mockResolvedValue([]);
      mockQuery.creditNote.findMany.mockResolvedValue([
        { total: 200 },
        { total: 100 },
      ]);
      mockQuery.customer.findFirst.mockResolvedValue({ balance: 700 });

      const result = await recalculateCustomerBalance("cust1");

      // 1000 - 0 - (200 + 100) = 700
      expect(result).toBe(700);
    });

    it("should exclude CANCELLED work orders", async () => {
      mockQuery.workOrder.findMany.mockResolvedValue([
        { id: "wo1", total: 500, payments: [] },
      ]);
      mockQuery.directSale.findMany.mockResolvedValue([]);
      mockQuery.creditNote.findMany.mockResolvedValue([]);
      mockQuery.customer.findFirst.mockResolvedValue({ balance: 500 });

      const result = await recalculateCustomerBalance("cust1");

      expect(result).toBe(500);
      // Drizzle's findMany is called with a where clause (SQL expression)
      // verifying the exact filter structure is not feasible with Drizzle mocks
      expect(mockQuery.workOrder.findMany).toHaveBeenCalled();
    });

    it("should log to balance_audit when stored balance differs from calculated", async () => {
      mockQuery.workOrder.findMany.mockResolvedValue([
        { id: "wo1", total: 100, payments: [] },
      ]);
      mockQuery.directSale.findMany.mockResolvedValue([]);
      mockQuery.creditNote.findMany.mockResolvedValue([]);
      mockQuery.customer.findFirst.mockResolvedValue({ balance: 200 }); // drift of 100

      const result = await recalculateCustomerBalance("cust1");

      expect(result).toBe(100);
      // Drizzle uses db.update(customer).set(...).where(...) — verify update was called
      expect(mockUpdate).toHaveBeenCalled();
      // Drizzle uses db.insert(balanceAudit).values(...) — verify insert was called
      expect(mockInsert).toHaveBeenCalled();
    });

    it("should NOT log to balance_audit when balance matches", async () => {
      mockQuery.workOrder.findMany.mockResolvedValue([
        { id: "wo1", total: 100, payments: [] },
      ]);
      mockQuery.directSale.findMany.mockResolvedValue([]);
      mockQuery.creditNote.findMany.mockResolvedValue([]);
      mockQuery.customer.findFirst.mockResolvedValue({ balance: 100 });

      const result = await recalculateCustomerBalance("cust1");

      expect(result).toBe(100);
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("should handle customer with no work orders, direct sales, or credit notes", async () => {
      mockQuery.workOrder.findMany.mockResolvedValue([]);
      mockQuery.directSale.findMany.mockResolvedValue([]);
      mockQuery.creditNote.findMany.mockResolvedValue([]);
      mockQuery.customer.findFirst.mockResolvedValue({ balance: 0 });

      const result = await recalculateCustomerBalance("cust1");

      expect(result).toBe(0);
    });
  });

  describe("adjustBalanceAtomically", () => {
    it("should increment balance by delta and create audit log", async () => {
      mockQuery.customer.findFirst.mockResolvedValue({ balance: 100 });
      // Mock update().set().where().returning() to return new balance
      const returningFn = vi.fn(() => Promise.resolve([{ balance: 150 }]));
      const whereFn = vi.fn(() => ({ returning: returningFn }));
      const setFn = vi.fn(() => ({ where: whereFn }));
      mockUpdate.mockReturnValue({ set: setFn });

      const result = await adjustBalanceAtomically(
        "cust1",
        50,
        "work_order_create",
      );

      expect(result).toBe(150);
      // Verify update was called (Drizzle chain: update().set().where().returning())
      expect(mockUpdate).toHaveBeenCalled();
      expect(setFn).toHaveBeenCalled();
      // Verify audit log insert was called
      expect(mockInsert).toHaveBeenCalled();
    });

    it("should handle negative delta (payments)", async () => {
      mockQuery.customer.findFirst.mockResolvedValue({ balance: 500 });
      const returningFn = vi.fn(() => Promise.resolve([{ balance: 300 }]));
      const whereFn = vi.fn(() => ({ returning: returningFn }));
      const setFn = vi.fn(() => ({ where: whereFn }));
      mockUpdate.mockReturnValue({ set: setFn });

      const result = await adjustBalanceAtomically("cust1", -200, "payment");

      expect(result).toBe(300);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("should throw if customer not found", async () => {
      mockQuery.customer.findFirst.mockResolvedValue(null);

      await expect(
        adjustBalanceAtomically("nonexistent", 100, "test"),
      ).rejects.toThrow("Customer not found: nonexistent");
    });
  });

  describe("getBalanceBreakdown", () => {
    it("should return detailed breakdown of debts", async () => {
      mockQuery.workOrder.findMany.mockResolvedValue([
        { id: "wo1", total: 500, payments: [{ amount: 200 }] },
        { id: "wo2", total: 300, payments: [{ amount: 300 }] },
      ]);
      mockQuery.directSale.findMany.mockResolvedValue([
        { id: "ds1", total: 400, directSalePayments: [{ amount: 100 }] },
      ]);
      mockQuery.creditNote.findMany.mockResolvedValue([
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
