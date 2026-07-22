/**
 * Characterization tests for Prisma → Drizzle migration.
 *
 * These tests exercise the service layer against the real database,
 * capturing current behavior BEFORE the migration so we can verify
 * the Drizzle implementation produces identical results AFTER.
 *
 * All test data is cleaned up in afterAll to leave the database pristine.
 *
 * Run: pnpm test:all
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getProducts,
  createProduct,
  updateProduct,
  adjustStock,
  getProductMovements,
} from "@/lib/services/productService";
import {
  getCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
} from "@/lib/services/customerService";
import {
  getCategories,
} from "@/lib/services/categoryService";
import {
  getSuppliers,
} from "@/lib/services/supplierService";
import {
  createDirectSale,
} from "@/lib/services/directSaleService";
import { createCashMovement, getCashMovements } from "@/lib/services/cashMovementService";
import { getSetting, setSetting } from "@/lib/services/settingsService";
import { recalculateCustomerBalance } from "@/lib/services/balanceService";

const TEST_TS = Date.now();

// Shared test data
let categoryId: string;
let supplierId: string;
let paymentMethodId: string;
let customerId: string;
let productId: string;
let directSaleId: string;
let vehicleId: string;
let workOrderId: string;
let settingKey: string;

// Track all created IDs for cleanup
const createdIds: { table: string; id: string }[] = [];

function track(table: string, id: string) {
  createdIds.push({ table, id });
}

async function cleanupAll() {
  for (const { table, id } of createdIds) {
    try {
      await (prisma as unknown as Record<string, { delete: (args: { where: { id: string } }) => Promise<unknown> }>)[table].delete({ where: { id } });
    } catch {
      // Already deleted or cascade handled
    }
  }
  createdIds.length = 0;
}

beforeAll(async () => {
  await prisma.$connect();

  // Create prerequisite data
  categoryId = `migtest-cat-${TEST_TS}`;
  supplierId = `migtest-sup-${TEST_TS}`;
  paymentMethodId = `migtest-pm-${TEST_TS}`;

  await prisma.category.create({
    data: {
      id: categoryId,
      name: `TestCat ${TEST_TS}`,
      defaultMarginPercent: 40,
      sortOrder: 999,
      isActive: true,
      updatedAt: new Date(),
    },
  });
  track("category", categoryId);

  await prisma.supplier.create({
    data: {
      id: supplierId,
      name: `TestSup ${TEST_TS}`,
      isActive: true,
      updatedAt: new Date(),
    },
  });
  track("supplier", supplierId);

  await prisma.payment_method.create({
    data: {
      id: paymentMethodId,
      name: `TestPM ${TEST_TS}`,
      code: `TESTPM${TEST_TS}`,
      sortOrder: 999,
      isActive: true,
      updatedAt: new Date(),
    },
  });
  track("payment_method", paymentMethodId);
});

afterAll(async () => {
  await cleanupAll();
  await prisma.$disconnect();
});

describe("Characterization: Product Service", () => {
  it("should create a product", async () => {
    const product = await createProduct({
      sku: `SKU-${TEST_TS}`,
      name: `TestProduct ${TEST_TS}`,
      costPrice: 100,
      replacementCost: 100,
      categoryId,
      supplierId,
      stock: 10,
      minStock: 2,
    });
    productId = product.id;
    track("product", productId);

    expect(product).toBeDefined();
    expect(product.name).toBe(`TestProduct ${TEST_TS}`);
    expect(product.stock).toBe(10);
  });

  it("should retrieve product by search", async () => {
    const result = await getProducts({ search: `TestProduct ${TEST_TS}` });
    expect(result.products.length).toBeGreaterThan(0);
    const found = result.products.find((p) => p.id === productId);
    expect(found).toBeDefined();
  });

  it("should update product", async () => {
    const updated = await updateProduct(productId, {
      name: `UpdatedProduct ${TEST_TS}`,
      costPrice: 150,
    });
    expect(updated.name).toBe(`UpdatedProduct ${TEST_TS}`);
    expect(Number(updated.costPrice)).toBe(150);
  });

  it("should adjust stock and create movement", async () => {
    const result = await adjustStock(
      productId,
      "add",
      5,
      "test-user",
      "Test User",
      "RECEPCION",
      "Test adjustment",
    );
    expect(result.stock).toBe(15);

    const movements = await getProductMovements(productId);
    expect(movements.length).toBeGreaterThan(0);
    const lastMove = movements[0];
    expect(lastMove.quantity).toBe(5);
    expect(lastMove.type).toBe("IN");
  });
});

describe("Characterization: Customer Service", () => {
  it("should create a customer", async () => {
    const customer = await createCustomer({
      name: `TestCustomer ${TEST_TS}`,
      phone: "3811234567",
      email: `test${TEST_TS}@example.com`,
    });
    customerId = customer.id;
    track("customer", customerId);

    expect(customer).toBeDefined();
    expect(customer.name).toContain("TestCustomer");
    expect(Number(customer.balance)).toBe(0);
  });

  it("should retrieve customer by id", async () => {
    const customer = await getCustomerById(customerId);
    expect(customer).toBeDefined();
    expect(customer!.id).toBe(customerId);
  });

  it("should update customer", async () => {
    const updated = await updateCustomer(customerId, {
      phone: "3817654321",
      notes: "Updated notes",
    });
    expect(updated.phone).toBe("3817654321");
    expect(updated.notes).toBe("Updated notes");
  });

  it("should list customers with search", async () => {
    const result = await getCustomers({ search: `TestCustomer ${TEST_TS}` });
    expect(result.customers.length).toBeGreaterThan(0);
    const found = result.customers.find((c) => c.id === customerId);
    expect(found).toBeDefined();
  });
});

describe("Characterization: Direct Sale Service", () => {
  it("should create a direct sale with items and payment", async () => {
    const sale = await createDirectSale({
      customerName: `Walk-in ${TEST_TS}`,
      customerId: null,
      items: [
        {
          productId,
          name: `TestProduct ${TEST_TS}`,
          quantity: 2,
          unitPrice: 200,
          totalPrice: 400,
        },
      ],
      payments: [
        {
          paymentMethodId,
          amount: 400,
        },
      ],
      createdBy: "test-user",
    });
    directSaleId = sale.id;
    track("direct_sale", directSaleId);

    expect(sale).toBeDefined();
    expect(sale.id).toBeDefined();
    expect(Number(sale.total)).toBe(400);

    // Re-fetch with items and payments (createDirectSale returns bare sale)
    const full = await prisma.direct_sale.findUnique({
      where: { id: directSaleId },
      include: { items: true, payments: true },
    });
    expect(full!.items).toHaveLength(1);
    expect(full!.payments).toHaveLength(1);
    for (const item of full!.items) track("direct_sale_item", item.id);
    for (const p of full!.payments) track("direct_sale_payment", p.id);
  });
});

describe("Characterization: Cash Movement Service", () => {
  it("should create a cash movement", async () => {
    const movement = await createCashMovement({
      type: "INCOME",
      amount: 500,
      method: "CASH",
      reason: "Test income",
      createdBy: "test-user",
    });
    track("cash_movement", movement.id);

    expect(movement).toBeDefined();
    expect(movement.type).toBe("INCOME");
    expect(Number(movement.amount)).toBe(500);
  });

  it("should list cash movements", async () => {
    const movements = await getCashMovements({});
    expect(Array.isArray(movements)).toBe(true);
  });
});

describe("Characterization: Settings Service", () => {
  it("should set and get a setting", async () => {
    settingKey = `test_setting_${TEST_TS}`;
    await setSetting(settingKey, "test_value");
    track("setting", settingKey);

    const value = await getSetting(settingKey);
    expect(value).toBe("test_value");
  });
});

describe("Characterization: Balance Service", () => {
  it("should recalculate customer balance (should be 0 for test customer)", async () => {
    const balance = await recalculateCustomerBalance(customerId);
    // Test customer has no work orders or direct sales linked
    expect(balance).toBe(0);
  });
});

describe("Characterization: Category & Supplier Services", () => {
  it("should list categories including test category", async () => {
    const categories = await getCategories(false);
    expect(categories.categories.length).toBeGreaterThan(0);
    const found = categories.categories.find((c) => c.id === categoryId);
    expect(found).toBeDefined();
    expect(found!.name).toBe(`TestCat ${TEST_TS}`);
  });

  it("should list suppliers including test supplier", async () => {
    const suppliers = await getSuppliers(false);
    expect(suppliers.suppliers.length).toBeGreaterThan(0);
    const found = suppliers.suppliers.find((s) => s.id === supplierId);
    expect(found).toBeDefined();
  });
});

describe("Characterization: Database Schema Integrity", () => {
  it("should have all expected tables", async () => {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `;
    const tableNames = tables.map((t) => t.tablename);
    expect(tableNames).toContain("customer");
    expect(tableNames).toContain("product");
    expect(tableNames).toContain("work_order");
    expect(tableNames).toContain("direct_sale");
    expect(tableNames).toContain("invoice");
    expect(tableNames).toContain("credit_note");
    expect(tableNames).toContain("payment");
    expect(tableNames).toContain("cash_movement");
    expect(tableNames).toContain("category");
    expect(tableNames).toContain("supplier");
    expect(tableNames).toContain("vehicle");
    expect(tableNames).toContain("stock_movement");
    expect(tableNames).toContain("balance_audit");
  });

  it("should preserve Decimal precision on numeric columns", async () => {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    expect(product).toBeDefined();
    expect(product).not.toBeNull();
    // costPrice is numeric(10,2) - should be 150.00
    expect(Number(product!.costPrice)).toBe(150);
  });

  it("should preserve array columns (entryPhotos on work_order)", async () => {
    vehicleId = `migtest-veh-${TEST_TS}`;
    workOrderId = `migtest-wo-${TEST_TS}`;

    await prisma.vehicle.create({
      data: {
        id: vehicleId,
        identifier: `TEST-VEH-${TEST_TS}`,
        category: "MOTO",
        customerId,
        updatedAt: new Date(),
      },
    });
    track("vehicle", vehicleId);

    const wo = await prisma.work_order.create({
      data: {
        id: workOrderId,
        status: "PENDING",
        customerId,
        vehicleId,
        entryPhotos: ["photo1.jpg", "photo2.jpg"],
        exitPhotos: [],
        total: 0,
        totalProducts: 0,
        totalServices: 0,
        notes: "Test work order",
        updatedAt: new Date(),
      },
    });
    track("work_order", workOrderId);

    expect(wo.entryPhotos).toEqual(["photo1.jpg", "photo2.jpg"]);
    expect(wo.exitPhotos).toEqual([]);
  });

  it("should preserve JSON columns", async () => {
    const updated = await prisma.work_order.update({
      where: { id: workOrderId },
      data: {
        entryChecklist: { items: ["brakes", "tires"], passed: true },
      },
    });
    expect(updated.entryChecklist).toEqual({ items: ["brakes", "tires"], passed: true });
  });
});
