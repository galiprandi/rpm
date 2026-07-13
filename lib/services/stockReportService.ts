import { prisma } from "@/lib/prisma";

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
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
    },
  });

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

  products.forEach((product) => {
    const stock = product.stock;
    const cost = decimalToNumber(product.costPrice);
    const value = stock * cost;

    totalValue += value;
    totalProducts += stock;
    if (stock <= product.minStock) {
      lowStockCount++;
    }

    if (!categoryMap[product.categoryId]) {
      categoryMap[product.categoryId] = {
        id: product.categoryId,
        name: product.category.name,
        count: 0,
        value: 0,
      };
    }
    categoryMap[product.categoryId].count += stock;
    categoryMap[product.categoryId].value += value;

    // Dead stock logic: stock > 0 and no movement in 90 days
    const lastMovement = product.lastMovementAt || product.createdAt;
    if (stock > 0 && lastMovement < ninetyDaysAgo) {
      deadStockList.push({
        id: product.id,
        name: product.name,
        stock: product.stock,
        value,
        lastMovement: product.lastMovementAt ? product.lastMovementAt.toISOString() : null,
      });
    }
  });

  const deadStockCount = deadStockList.length;
  const deadStockValue = deadStockList.reduce((sum, p) => sum + p.value, 0);

  // Inventory Turnover Calculation (COGS 30 days / Current Inventory)
  const [woItems, dsItems] = await Promise.all([
    prisma.work_order_item.findMany({
      where: {
        productId: { not: null },
        work_order: {
          status: { in: ["DELIVERED", "READY", "PAID"] },
          completedAt: { gte: thirtyDaysAgo },
        },
      },
      include: {
        product: { select: { costPrice: true } },
      },
    }),
    prisma.direct_sale_item.findMany({
      where: {
        productId: { not: null },
        directSale: {
          createdAt: { gte: thirtyDaysAgo },
        },
      },
      include: {
        product: { select: { costPrice: true } },
      },
    }),
  ]);

  let cogs30d = 0;
  woItems.forEach((item) => {
    if (item.product) {
      cogs30d += item.quantity * decimalToNumber(item.product.costPrice);
    }
  });
  dsItems.forEach((item) => {
    if (item.product) {
      cogs30d += item.quantity * decimalToNumber(item.product.costPrice);
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
      category: p.category.name,
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
