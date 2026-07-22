/**
 * Migration Regression Test: Prisma → Drizzle
 *
 * Validates that the big-bang ORM migration did not introduce regressions
 * across the critical API surface. Exercises every high-risk area:
 *
 * 1. Timestamp format consistency (Drizzle mode:'string' returns raw PG
 *    strings like "2026-07-21 21:32:23.162" instead of ISO 8601 with Z).
 *    Services that don't convert via new Date() leak PG format to the API.
 * 2. Decimal/numeric serialization (Prisma Decimal → Number() / string).
 *    Financial fields must be valid numbers, not NaN or [object Object].
 * 3. Error code mapping (Prisma P2002 → PostgreSQL 23505).
 * 4. Relational queries (Prisma include → Drizzle with).
 * 5. Data shape compatibility for every critical endpoint.
 *
 * Run: pnpm test:all -- tests/regression/migration-regression.test.ts
 * Requires: dev server running on http://localhost:3000
 */

import { describe, it, expect, beforeAll } from "vitest";

const BASE = "http://localhost:3000";
const ISO_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const PG_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/;

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, init);
  return { status: res.status, data: await res.json() };
}

function assertValidDate(value: unknown, field: string, context: string) {
  if (value === null || value === undefined) return;
  expect(typeof value, `${context}.${field} should be string`).toBe("string");
  if (ISO_REGEX.test(value as string)) return; // OK
  if (PG_TIMESTAMP_REGEX.test(value as string)) {
    // PG raw format leaked — this is the regression we're hunting
    throw new Error(
      `${context}.${field}="${value}" is in raw PostgreSQL format (missing T separator and Z timezone). ` +
        `Service must convert via new Date() to produce ISO 8601.`,
    );
  }
  throw new Error(`${context}.${field}="${value}" is not a recognizable timestamp format`);
}

function assertValidNumber(value: unknown, field: string, context: string) {
  if (value === null || value === undefined) return;
  const n = Number(value);
  expect(Number.isNaN(n), `${context}.${field}="${value}" must not be NaN`).toBe(false);
}

// Verify server availability synchronously at module load so skipIf works
let serverAvailable = false;
try {
  const res = await fetch(`${BASE}/api/health/db`);
  serverAvailable = res.ok;
} catch {
  serverAvailable = false;
}

if (!serverAvailable) {
  console.warn("Dev server not running on :3000 — tests will be skipped");
}

beforeAll(async () => {});

describe.skipIf(!serverAvailable)("Migration Regression: API Surface", () => {
  describe("Health & DB", () => {
    it("GET /api/health/db → healthy with postgresql", async () => {
      const { status, data } = await api("/api/health/db");
      expect(status).toBe(200);
      expect(data.status).toBe("healthy");
      expect(data.database).toBe("postgresql");
    });
  });

  describe("Customers — timestamps + decimals", () => {
    it("GET /api/customers → ISO timestamps, numeric balance", async () => {
      const { status, data } = await api("/api/customers?limit=5");
      expect(status).toBe(200);
      expect(Array.isArray(data.customers)).toBe(true);
      if (data.customers.length === 0) return;
      for (const c of data.customers) {
        assertValidDate(c.createdAt, "createdAt", "customer");
        assertValidDate(c.updatedAt, "updatedAt", "customer");
        assertValidNumber(c.balance, "balance", `customer[${c.id}]`);
      }
    });

    it("GET /api/customers/:id → single customer shape", async () => {
      const list = await api("/api/customers?limit=1");
      if (list.data.customers?.length === 0) return;
      const id = list.data.customers[0].id;
      const { status, data } = await api(`/api/customers/${id}`);
      expect(status).toBe(200);
      assertValidDate(data.createdAt, "createdAt", "customer-detail");
      assertValidDate(data.updatedAt, "updatedAt", "customer-detail");
      assertValidNumber(data.balance, "balance", "customer-detail");
    });
  });

  describe("Products — decimals + relations", () => {
    it("GET /api/products → numeric prices, category/supplier relations", async () => {
      const { status, data } = await api("/api/products?limit=5");
      expect(status).toBe(200);
      expect(Array.isArray(data.products)).toBe(true);
      if (data.products.length === 0) return;
      for (const p of data.products) {
        assertValidNumber(p.costPrice, "costPrice", `product[${p.id}]`);
        assertValidNumber(p.replacementCost, "replacementCost", `product[${p.id}]`);
        expect(typeof p.stock).toBe("number");
        expect(typeof p.isActive).toBe("boolean");
        // Relational query (Prisma include → Drizzle with)
        if (p.categoryId) {
          expect(p.category, "product.category relation").toBeDefined();
          expect(p.category?.name).toBeTruthy();
        }
        if (p.supplierId) {
          expect(p.supplier, "product.supplier relation").toBeDefined();
        }
      }
    });
  });

  describe("Work Orders — CRITICAL timestamp regression zone", () => {
    it("GET /api/work-orders/:id → camelCase keys (not Prisma snake_case)", async () => {
      const list = await api("/api/work-orders?limit=1");
      if (!list.data.workOrders?.length) return;
      const id = list.data.workOrders[0].id;
      const { status, data } = await api(`/api/work-orders/${id}`);
      expect(status).toBe(200);
      // Drizzle returns camelCase relation names; Prisma returned snake_case.
      // The [id]/page.tsx still references work_order_item / vehicle_make /
      // vehicle_model (snake_case), causing a crash. This test catches that.
      expect(data.workOrderItems, "workOrderItems (camelCase) must be present").toBeDefined();
      expect(data.work_order_item, "work_order_item (snake_case) must NOT be present").toBeUndefined();
      if (data.vehicle) {
        expect(data.vehicle.vehicleMake, "vehicle.vehicleMake (camelCase)").toBeDefined();
        expect(data.vehicle.vehicle_make, "vehicle.vehicle_make (snake_case) must NOT be present").toBeUndefined();
        expect(data.vehicle.vehicleModel, "vehicle.vehicleModel (camelCase)").toBeDefined();
        expect(data.vehicle.vehicle_model, "vehicle.vehicle_model (snake_case) must NOT be present").toBeUndefined();
      }
    });

    it("GET /api/work-orders → ISO timestamps (not raw PG format)", async () => {
      const { status, data } = await api("/api/work-orders?limit=5");
      expect(status).toBe(200);
      expect(Array.isArray(data.workOrders)).toBe(true);
      if (data.workOrders.length === 0) return;
      for (const wo of data.workOrders) {
        // These are the fields most likely to leak PG timestamp format
        assertValidDate(wo.createdAt, "createdAt", `workOrder[${wo.id}]`);
        assertValidDate(wo.updatedAt, "updatedAt", `workOrder[${wo.id}]`);
        // Optional date fields
        if (wo.scheduledDate !== null) assertValidDate(wo.scheduledDate, "scheduledDate", `workOrder[${wo.id}]`);
        if (wo.startedAt !== null) assertValidDate(wo.startedAt, "startedAt", `workOrder[${wo.id}]`);
        if (wo.completedAt !== null) assertValidDate(wo.completedAt, "completedAt", `workOrder[${wo.id}]`);
        if (wo.deliveredAt !== null) assertValidDate(wo.deliveredAt, "deliveredAt", `workOrder[${wo.id}]`);
        // Numeric totals
        assertValidNumber(wo.total, "total", `workOrder[${wo.id}]`);
        assertValidNumber(wo.totalProducts, "totalProducts", `workOrder[${wo.id}]`);
        assertValidNumber(wo.totalServices, "totalServices", `workOrder[${wo.id}]`);
        // Relations
        expect(wo.customer, "workOrder.customer relation").toBeDefined();
        expect(wo.vehicle, "workOrder.vehicle relation").toBeDefined();
        // Items relation
        if (wo.workOrderItems && wo.workOrderItems.length > 0) {
          for (const item of wo.workOrderItems) {
            assertValidNumber(item.unitPrice, "unitPrice", `workOrderItem[${item.id}]`);
            assertValidNumber(item.subtotal, "subtotal", `workOrderItem[${item.id}]`);
          }
        }
      }
    });
  });

  describe("Direct Sales — financial integrity", () => {
    it("GET /api/direct-sales → numeric totals, valid dates", async () => {
      const { status, data } = await api("/api/direct-sales?limit=5");
      expect(status).toBe(200);
      if (data.sales && data.sales.length > 0) {
        for (const s of data.sales) {
          assertValidDate(s.createdAt, "createdAt", `directSale[${s.id}]`);
          assertValidNumber(s.total, "total", `directSale[${s.id}]`);
        }
      }
    });
  });

  describe("Cash — status + movements", () => {
    it("GET /api/cash/status → valid shape with numeric summary", async () => {
      const { status, data } = await api("/api/cash/status");
      expect(status).toBe(200);
      expect(["OPEN", "CLOSED"]).toContain(data.status);
      if (data.openedAt) assertValidDate(data.openedAt, "openedAt", "cashStatus");
      if (data.closedAt) assertValidDate(data.closedAt, "closedAt", "cashStatus");
      if (data.summary) {
        for (const [method, sums] of Object.entries(data.summary)) {
          const s = sums as Record<string, unknown>;
          assertValidNumber(s.opening, "opening", `cashSummary.${method}`);
          assertValidNumber(s.income, "income", `cashSummary.${method}`);
          assertValidNumber(s.expense, "expense", `cashSummary.${method}`);
          assertValidNumber(s.expected, "expected", `cashSummary.${method}`);
        }
      }
    });

    it("GET /api/cash-movements → array with numeric amounts", async () => {
      const { status, data } = await api("/api/cash-movements?limit=5");
      expect(status).toBe(200);
      const movements = data.movements || data;
      if (Array.isArray(movements) && movements.length > 0) {
        for (const m of movements) {
          assertValidNumber(m.amount, "amount", `cashMovement[${m.id}]`);
          if (m.createdAt) assertValidDate(m.createdAt, "createdAt", `cashMovement[${m.id}]`);
        }
      }
    });
  });

  describe("Dashboard — aggregations + date filtering", () => {
    it("GET /api/dashboard/summary → numeric stats, valid dates", async () => {
      const { status, data } = await api("/api/dashboard/summary");
      expect(status).toBe(200);
      assertValidNumber(data.sales?.today?.total, "sales.today.total", "dashboard");
      assertValidNumber(data.sales?.ticketAverage, "sales.ticketAverage", "dashboard");
      assertValidNumber(data.workOrders?.active?.total, "workOrders.active.total", "dashboard");
      // oldestPending entries should have ISO createdAt
      const pending = data.workOrders?.active?.oldestPending;
      if (pending && pending.length > 0) {
        for (const p of pending) {
          assertValidDate(p.createdAt, "createdAt", "dashboard.oldestPending");
        }
      }
    });

    it("GET /api/dashboard/operations → valid shape", async () => {
      const { status, data } = await api("/api/dashboard/operations?limit=5");
      expect(status).toBe(200);
      const ops = data.operations || data;
      if (Array.isArray(ops) && ops.length > 0) {
        for (const op of ops) {
          if (op.createdAt) assertValidDate(op.createdAt, "createdAt", "dashboard.operation");
          if (op.total !== undefined) assertValidNumber(op.total, "total", "dashboard.operation");
        }
      }
    });
  });

  describe("Reports — aggregations with date ranges", () => {
    it("GET /api/reports/debtors → numeric balances, valid dates", async () => {
      const { status, data } = await api("/api/reports/debtors");
      expect(status).toBe(200);
      if (data.debtors && data.debtors.length > 0) {
        for (const d of data.debtors) {
          assertValidNumber(d.balance, "balance", `debtor[${d.customerId}]`);
          assertValidNumber(d.workOrderDebt, "workOrderDebt", `debtor[${d.customerId}]`);
          assertValidNumber(d.directSaleDebt, "directSaleDebt", `debtor[${d.customerId}]`);
          if (d.oldestDebtDate) assertValidDate(d.oldestDebtDate, "oldestDebtDate", `debtor[${d.customerId}]`);
          if (d.recentWorkOrders) {
            for (const wo of d.recentWorkOrders) {
              assertValidDate(wo.createdAt, "createdAt", `debtor.recentWorkOrders`);
              assertValidNumber(wo.total, "total", `debtor.recentWorkOrders`);
            }
          }
        }
      }
    });

    it("GET /api/reports/finance → numeric aggregations", async () => {
      const { status, data } = await api(
        "/api/reports/finance?startDate=2026-01-01&endDate=2026-12-31",
      );
      expect(status).toBe(200);
      // Just verify no NaN leaked into aggregations
      const json = JSON.stringify(data);
      expect(json).not.toContain("NaN");
      expect(json).not.toContain("undefined");
    });
  });

  describe("Categories & Suppliers — simple CRUD reads", () => {
    it("GET /api/categories → array with names", async () => {
      const { status, data } = await api("/api/categories");
      expect(status).toBe(200);
      expect(Array.isArray(data.categories)).toBe(true);
      if (data.categories.length > 0) {
        expect(typeof data.categories[0].name).toBe("string");
      }
    });

    it("GET /api/suppliers → array with names", async () => {
      const { status, data } = await api("/api/suppliers");
      expect(status).toBe(200);
      expect(Array.isArray(data.suppliers)).toBe(true);
      if (data.suppliers.length > 0) {
        expect(typeof data.suppliers[0].name).toBe("string");
      }
    });
  });

  describe("Vehicles — relations (make/model)", () => {
    it("GET /api/vehicles → relations loaded", async () => {
      const { status, data } = await api("/api/vehicles?limit=5");
      expect(status).toBe(200);
      const vehicles = data.vehicles || data;
      if (Array.isArray(vehicles) && vehicles.length > 0) {
        for (const v of vehicles) {
          if (v.makeId) {
            expect(v.vehicleMake, "vehicle.vehicleMake relation").toBeDefined();
          }
          if (v.modelId) {
            expect(v.vehicleModel, "vehicle.vehicleModel relation").toBeDefined();
          }
        }
      }
    });
  });

  describe("Error code mapping (P2002 → 23505)", () => {
    it("POST /api/categories with duplicate name → 409 (not 500)", async () => {
      // First get an existing category name
      const list = await api("/api/categories");
      if (!list.data.categories?.length) return;
      const existing = list.data.categories[0];

      const { status } = await api("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: existing.name, sortOrder: 999 }),
      });
      // Should be 409 Conflict, NOT 500 Internal Server Error
      // (If the error code mapping broke, we'd get 500)
      expect([400, 409]).toContain(status);
      expect(status).not.toBe(500);
    });
  });
});
