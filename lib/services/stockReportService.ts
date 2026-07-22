import { db } from "@/lib/db";
import {
  product,
  category,
  workOrder,
  directSale,
  workOrderItem,
  directSaleItem,
} from "@/db/schema";
import { and, eq, inArray, gte, isNotNull } from "drizzle-orm";

export interface CategoryDistribution {
  id: string;
  name: string;
  count: number;
  value: number;
}

export interface StockReportData {
  totalValue: number;
  totalProducts: number;
  lowStockCount: number;
  activeProducts: number;
  deadStockCount: number;
  deadStockValue: number;
  inventoryTurnover: number;
  categoryDistribution: CategoryDistribution[];
  topValuedProducts: Array<{
    id: string;
    name: string;
    stock: number;
    value: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock: number;
    minStock: number;
    category: string;
  }>;
  deadStockProducts: Array<{
    id: string;
    name: string;
    stock: number;
    value: number;
    lastMovement: string | null;
  }>;
  generatedAt: string;
}

/**
 * Helper to convert Decimal to number
 */
function decimalToNumber(decimal: unknown): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === "number") return decimal;
  if (
    typeof decimal === "object" &&
    decimal !== null &&
    "toNumber" in decimal &&
    typeof (decimal as { toNumber: unknown }).toNumber === "function"
  ) {
    return (decimal as { toNumber: () => number }).toNumber();
  }
  return Number(decimal);
}

/**
 * Generates an inventory/stock report
 */
export async function getInventoryReport(): Promise<StockReportData> {
  const products = await db.select({
    id: product.id,
    name: product.name,
    stock: product.stock,
    minStock: product.minStock,
    costPrice: product.costPrice,
    categoryId: product.categoryId,
    lastMovementAt: product.lastMovementAt,
    createdAt: product.createdAt,
    categoryName: category.name,
  }).from(product).leftJoin(
    category, eq(product.categoryId, category.id),
  ).where(eq(product.isActive, true));

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let totalValue = 0;
  let totalProducts = 0;
  let lowStockCount = 0;
  const categoryMap: Record<string, CategoryDistribution> = {};

  const deadStockList: Array<{
    id: string;
    name: string;
    stock: number;
    value: number;
    lastMovement: string | null;
  }> = [];

  products.forEach((p) => {
    const stock = p.stock;
    const cost = decimalToNumber(p.costPrice);
    const value = stock * cost;

    totalValue += value;
    totalProducts += stock;
    if (stock <= p.minStock) {
      lowStockCount++;
    }

    if (!categoryMap[p.categoryId]) {
      categoryMap[p.categoryId] = {
        id: p.categoryId,
        name: p.categoryName || "Sin categoría",
        count: 0,
        value: 0,
      };
    }
    categoryMap[p.categoryId].count += stock;
    categoryMap[p.categoryId].value += value;

    // Dead stock logic: stock > 0 and no movement in 90 days
    const lastMovementStr = p.lastMovementAt || p.createdAt;
    const lastMovement = new Date(lastMovementStr);
    if (stock > 0 && lastMovement < ninetyDaysAgo) {
      deadStockList.push({
        id: p.id,
        name: p.name,
        stock: p.stock,
        value,
        lastMovement: p.lastMovementAt ? new Date(p.lastMovementAt).toISOString() : null,
      });
    }
  });

  const deadStockCount = deadStockList.length;
  const deadStockValue = deadStockList.reduce((sum, p) => sum + p.value, 0);

  // Inventory Turnover Calculation (COGS 30 days / Current Inventory)
  const saleStatuses = ["DELIVERED", "READY", "PAID"];
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
  const [woItems, dsItems] = await Promise.all([
    db.select({
      quantity: workOrderItem.quantity,
      productCostPrice: product.costPrice,
    }).from(workOrderItem).innerJoin(
      workOrder, eq(workOrderItem.workOrderId, workOrder.id),
    ).leftJoin(
      product, eq(workOrderItem.productId, product.id),
    ).where(and(
      isNotNull(workOrderItem.productId),
      inArray(workOrder.status, saleStatuses),
      gte(workOrder.completedAt, thirtyDaysAgoStr),
    )),
    db.select({
      quantity: directSaleItem.quantity,
      productCostPrice: product.costPrice,
    }).from(directSaleItem).innerJoin(
      directSale, eq(directSaleItem.directSaleId, directSale.id),
    ).leftJoin(
      product, eq(directSaleItem.productId, product.id),
    ).where(and(
      isNotNull(directSaleItem.productId),
      gte(directSale.createdAt, thirtyDaysAgoStr),
    )),
  ]);

  let cogs30d = 0;
  woItems.forEach((item) => {
    if (item.productCostPrice !== null) {
      cogs30d += item.quantity * decimalToNumber(item.productCostPrice);
    }
  });
  dsItems.forEach((item) => {
    if (item.productCostPrice !== null) {
      cogs30d += item.quantity * decimalToNumber(item.productCostPrice);
    }
  });

  // Annualized Inventory Turnover
  const inventoryTurnover = totalValue > 0 ? (cogs30d * 12) / totalValue : 0;

  const topValuedProducts = products
    .map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      value: p.stock * decimalToNumber(p.costPrice),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const lowStockProducts = products
    .filter((p) => p.stock <= p.minStock)
    .map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      minStock: p.minStock,
      category: p.categoryName || "Sin categoría",
    }))
    .sort((a, b) => a.stock - b.stock);

  return {
    totalValue,
    totalProducts,
    lowStockCount,
    activeProducts: products.length,
    deadStockCount,
    deadStockValue,
    inventoryTurnover,
    categoryDistribution: Object.values(categoryMap).sort((a, b) => b.value - a.value),
    topValuedProducts,
    lowStockProducts,
    deadStockProducts: deadStockList.sort((a, b) => b.value - a.value).slice(0, 10),
    generatedAt: new Date().toISOString(),
  };
}
