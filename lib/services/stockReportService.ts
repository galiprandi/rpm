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

  let totalValue = 0;
  let totalProducts = 0;
  let lowStockCount = 0;
  const categoryMap: Record<string, CategoryDistribution> = {};

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
  });

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
    categoryDistribution: Object.values(categoryMap).sort((a, b) => b.value - a.value),
    topValuedProducts,
    lowStockProducts,
    generatedAt: new Date().toISOString(),
  };
}
