/**
 * Anti-drift regression tests.
 *
 * These tests verify that the cumulative balance from adjustBalanceAtomically
 * (incremental deltas) matches the balance from recalculateCustomerBalance
 * (source-of-truth recalculation) after a sequence of operations.
 *
 * This is the exact class of bug we fixed: the old code used read-modify-write
 * and didn't account for direct sales / credit notes, causing drift over time.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Track a virtual customer balance that adjustBalanceAtomically mutates
let virtualBalance = 0;
let pendingDelta = 0;
const adjustments: Array<{ delta: number; source: string }> = [];

// Track virtual DB state that recalculateCustomerBalance reads
let virtualWorkOrders: Array<{
  id: string;
  total: number;
  status: string;
  payments: Array<{ amount: number }>;
}> = [];
let virtualDirectSales: Array<{
  id: string;
  total: number;
  directSalePayments: Array<{ amount: number }>;
}> = [];
let virtualCreditNotes: Array<{ id: string; total: number; status: string }> =
  [];

const { mockDb } = vi.hoisted(() => {
  const mockDb = {
    query: {
      workOrder: {
        findMany: vi.fn(() => {
          // Filter out CANCELLED (service uses notInArray(workOrder.status, ["CANCELLED"]))
          return virtualWorkOrders.filter((w) => w.status !== "CANCELLED");
        }),
      },
      directSale: {
        findMany: vi.fn(() => virtualDirectSales),
      },
      creditNote: {
        findMany: vi.fn(() => {
          // Filter to ISSUED + ACCOUNT_CREDIT (service uses inArray(creditNote.status, ["ISSUED", "ACCOUNT_CREDIT"]))
          return virtualCreditNotes.filter((c) =>
            ["ISSUED", "ACCOUNT_CREDIT"].includes(c.status),
          );
        }),
      },
      customer: {
        findFirst: vi.fn(() => ({ balance: virtualBalance })),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn((setArg: { balance: unknown }) => {
        const isDirectSet = typeof setArg.balance === "string";
        if (isDirectSet) {
          // recalculateCustomerBalance: set balance to calculated value
          virtualBalance = Number(setArg.balance);
        }
        return {
          where: vi.fn(() => {
            if (isDirectSet) {
              // recalculateCustomerBalance: no .returning() called
              return Promise.resolve();
            }
            // adjustBalanceAtomically: .returning() will be called
            return {
              returning: vi.fn(() => {
                // Apply the pending delta (SQL increment)
                virtualBalance += pendingDelta;
                return Promise.resolve([{ balance: virtualBalance }]);
              }),
            };
          }),
        };
      }),
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

import {
  recalculateCustomerBalance,
  adjustBalanceAtomically,
} from "@/lib/services/balanceService";

function resetState() {
  virtualBalance = 0;
  pendingDelta = 0;
  adjustments.length = 0;
  virtualWorkOrders = [];
  virtualDirectSales = [];
  virtualCreditNotes = [];
}

function addWorkOrder(id: string, total: number) {
  virtualWorkOrders.push({ id, total, status: "PENDING", payments: [] });
}

function addPaymentToWorkOrder(woId: string, amount: number) {
  const wo = virtualWorkOrders.find((w) => w.id === woId);
  if (wo) wo.payments.push({ amount });
}

function cancelWorkOrder(woId: string) {
  const wo = virtualWorkOrders.find((w) => w.id === woId);
  if (wo) wo.status = "CANCELLED";
}

function addDirectSale(id: string, total: number) {
  virtualDirectSales.push({ id, total, directSalePayments: [] });
}

function addPaymentToDirectSale(dsId: string, amount: number) {
  const ds = virtualDirectSales.find((d) => d.id === dsId);
  if (ds) ds.directSalePayments.push({ amount });
}

function addCreditNote(id: string, total: number) {
  virtualCreditNotes.push({ id, total, status: "ISSUED" });
}

function cancelCreditNote(cnId: string) {
  const cn = virtualCreditNotes.find((c) => c.id === cnId);
  if (cn) cn.status = "CANCELLED";
}

async function applyDelta(delta: number, source: string) {
  pendingDelta = delta;
  adjustments.push({ delta, source });
  await adjustBalanceAtomically("cust1", delta, source);
}

/**
 * The core anti-drift assertion: cumulative deltas must equal recalculation.
 */
async function expectNoDrift() {
  const recalculated = await recalculateCustomerBalance("cust1");
  const cumulative = adjustments.reduce((sum, a) => sum + a.delta, 0);

  expect(recalculated).toBe(cumulative);
  expect(virtualBalance).toBe(cumulative);
  expect(virtualBalance).toBe(recalculated);
}

describe("Anti-drift regression tests", () => {
  beforeEach(() => {
    resetState();
  });

  it("WO create → WO payment → no drift", async () => {
    // Create WO for $1000
    addWorkOrder("wo1", 1000);
    await applyDelta(1000, "work_order_create");

    // Pay $400
    addPaymentToWorkOrder("wo1", 400);
    await applyDelta(-400, "payment");

    // Balance should be 600 both ways
    await expectNoDrift();
  });

  it("WO create → full payment → no drift (balance = 0)", async () => {
    addWorkOrder("wo1", 500);
    await applyDelta(500, "work_order_create");

    addPaymentToWorkOrder("wo1", 500);
    await applyDelta(-500, "payment");

    await expectNoDrift();
  });

  it("multiple WOs with partial payments → no drift", async () => {
    addWorkOrder("wo1", 1000);
    await applyDelta(1000, "work_order_create");

    addWorkOrder("wo2", 500);
    await applyDelta(500, "work_order_create");

    addPaymentToWorkOrder("wo1", 300);
    await applyDelta(-300, "payment");

    addPaymentToWorkOrder("wo2", 500);
    await applyDelta(-500, "payment");

    // Balance: 1000 + 500 - 300 - 500 = 700
    await expectNoDrift();
  });

  it("WO create → cancel WO → no drift (balance back to 0)", async () => {
    addWorkOrder("wo1", 800);
    await applyDelta(800, "work_order_create");

    // Cancel: reverse the unpaid balance
    // WO total=800, payments=0, so reversal = -(800-0) = -800
    cancelWorkOrder("wo1");
    await applyDelta(-800, "work_order_cancel");

    await expectNoDrift();
  });

  it("WO create → partial payment → cancel → no drift", async () => {
    addWorkOrder("wo1", 1000);
    await applyDelta(1000, "work_order_create");

    addPaymentToWorkOrder("wo1", 400);
    await applyDelta(-400, "payment");

    // Cancel: reverse remaining = -(1000 - 400) = -600
    cancelWorkOrder("wo1");
    await applyDelta(-600, "work_order_cancel");

    await expectNoDrift();
  });

  it("direct sale credit → payment → no drift", async () => {
    addDirectSale("ds1", 600);
    await applyDelta(600, "direct_sale");

    addPaymentToDirectSale("ds1", 200);
    await applyDelta(-200, "direct_sale_payment");

    await expectNoDrift();
  });

  it("credit note issued → no drift (reduces balance)", async () => {
    addWorkOrder("wo1", 1000);
    await applyDelta(1000, "work_order_create");

    addCreditNote("cn1", 300);
    await applyDelta(-300, "credit_note");

    // Balance: 1000 - 300 = 700
    await expectNoDrift();
  });

  it("credit note issued → cancelled → no drift (balance restored)", async () => {
    addWorkOrder("wo1", 1000);
    await applyDelta(1000, "work_order_create");

    addCreditNote("cn1", 300);
    await applyDelta(-300, "credit_note");

    // Cancel credit note: reverse the credit
    cancelCreditNote("cn1");
    await applyDelta(300, "credit_note_cancel");

    // Balance: 1000 - 300 + 300 = 1000
    await expectNoDrift();
  });

  it("complex scenario: WO + direct sale + credit note + payments → no drift", async () => {
    // WO for $2000
    addWorkOrder("wo1", 2000);
    await applyDelta(2000, "work_order_create");

    // Pay $800 on WO
    addPaymentToWorkOrder("wo1", 800);
    await applyDelta(-800, "payment");

    // Direct sale for $500 on credit
    addDirectSale("ds1", 500);
    await applyDelta(500, "direct_sale");

    // Pay $200 on direct sale
    addPaymentToDirectSale("ds1", 200);
    await applyDelta(-200, "direct_sale_payment");

    // Credit note for $150
    addCreditNote("cn1", 150);
    await applyDelta(-150, "credit_note");

    // Balance: 2000 - 800 + 500 - 200 - 150 = 1350
    await expectNoDrift();
  });

  it("WO items update (price change) → no drift", async () => {
    // Original WO total = 500
    addWorkOrder("wo1", 500);
    await applyDelta(500, "work_order_create");

    // Items updated: new total = 700, delta = +200
    const wo = virtualWorkOrders.find((w) => w.id === "wo1");
    if (wo) wo.total = 700;
    await applyDelta(200, "work_order_items_update");

    // Balance: 500 + 200 = 700
    await expectNoDrift();
  });

  it("WO create → delete WO → no drift (balance back to 0)", async () => {
    addWorkOrder("wo1", 1200);
    await applyDelta(1200, "work_order_create");

    addPaymentToWorkOrder("wo1", 500);
    await applyDelta(-500, "payment");

    // Delete: reverse remaining = -(1200 - 500) = -700
    // Remove WO from virtual state (simulates delete)
    virtualWorkOrders = virtualWorkOrders.filter((w) => w.id !== "wo1");
    await applyDelta(-700, "work_order_delete");

    await expectNoDrift();
  });

  it("customer payment (account-level) → no drift", async () => {
    addWorkOrder("wo1", 1000);
    await applyDelta(1000, "work_order_create");

    addWorkOrder("wo2", 500);
    await applyDelta(500, "work_order_create");

    // Account-level payment of $800 (distributed across WOs)
    addPaymentToWorkOrder("wo1", 800);
    await applyDelta(-800, "customer_payment");

    // Balance: 1000 + 500 - 800 = 700
    await expectNoDrift();
  });

  it("would catch the old bug: direct sale without balance update", async () => {
    // Simulate the OLD buggy behavior: direct sale created but balance NOT updated
    addDirectSale("ds1", 500);
    // OLD BUG: no adjustBalanceAtomically call here

    // Capture balance BEFORE recalculation (which would correct it)
    const balanceBeforeRecalc = virtualBalance;

    // Recalculation sees the direct sale debt of 500
    const recalculated = await recalculateCustomerBalance("cust1");

    // But virtualBalance was never incremented (old bug)
    expect(recalculated).toBe(500);
    expect(balanceBeforeRecalc).toBe(0); // This is the drift!
    expect(recalculated).not.toBe(balanceBeforeRecalc); // Drift detected
  });

  it("would catch the old bug: credit note without balance update", async () => {
    addWorkOrder("wo1", 1000);
    await applyDelta(1000, "work_order_create");

    // Simulate OLD bug: credit note created but balance NOT reduced
    addCreditNote("cn1", 300);
    // OLD BUG: no adjustBalanceAtomically(-300, "credit_note") here

    // Capture balance BEFORE recalculation (which would correct it)
    const balanceBeforeRecalc = virtualBalance;

    const recalculated = await recalculateCustomerBalance("cust1");

    // Recalculation: 1000 - 300 = 700
    // But balanceBeforeRecalc: 1000 (credit note was never subtracted)
    expect(recalculated).toBe(700);
    expect(balanceBeforeRecalc).toBe(1000); // Drift of 300!
    expect(recalculated).not.toBe(balanceBeforeRecalc);
  });
});
