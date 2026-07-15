import { prisma } from "@/lib/prisma";
import { ARGENTINA_TIMEZONE } from "@/lib/utils/date";

export interface OverviewReportParams {
  startDate: Date;
  endDate: Date;
  comparisonStartDate?: Date;
  comparisonEndDate?: Date;
}

export interface MetricWithChange {
  current: number;
  previous: number;
  change: number;
}

export interface OverviewReportData {
  revenue: MetricWithChange;
  estimatedProfit: MetricWithChange;
  completedOrders: MetricWithChange;
  newCustomers: MetricWithChange;
  stockStatus: {
    totalValue: number;
    lowStockCount: number;
  };
  generatedAt: string;
}

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

async function getPeriodMetrics(start: Date, end: Date) {
  // 1. Revenue
  const [woSales, dsSales] = await Promise.all([
    prisma.work_order.aggregate({
      where: {
        status: { in: ["DELIVERED", "READY", "PAID"] },
        completedAt: { gte: start, lte: end },
      },
      _sum: { total: true },
    }),
    prisma.direct_sale.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
      },
      _sum: { total: true },
    }),
  ]);

  const revenue = decimalToNumber(woSales._sum.total) + decimalToNumber(dsSales._sum.total);

  // 2. Estimated Profit (Revenue - Estimated Cost)
  // We calculate cost from items
  const [woItems, dsItems] = await Promise.all([
    prisma.work_order_item.findMany({
      where: {
        work_order: {
          status: { in: ["DELIVERED", "READY", "PAID"] },
          completedAt: { gte: start, lte: end },
        },
      },
      include: {
        product: { select: { costPrice: true } },
        service: { select: { baseCost: true } },
      },
    }),
    prisma.direct_sale_item.findMany({
      where: {
        directSale: {
          createdAt: { gte: start, lte: end },
        },
      },
      include: {
        product: { select: { costPrice: true } },
        service: { select: { baseCost: true } },
      },
    }),
  ]);

  let totalCost = 0;
  woItems.forEach((item) => {
    const unitCost = item.productId
      ? decimalToNumber(item.product?.costPrice)
      : decimalToNumber(item.service?.baseCost);
    totalCost += unitCost * item.quantity;
  });

  dsItems.forEach((item) => {
    const unitCost = item.productId
      ? decimalToNumber(item.product?.costPrice)
      : decimalToNumber(item.service?.baseCost);
    totalCost += unitCost * item.quantity;
  });

  const estimatedProfit = revenue - totalCost;

  // 3. Completed Orders
  const completedOrders = await prisma.work_order.count({
    where: {
      status: { in: ["DELIVERED", "READY", "PAID"] },
      completedAt: { gte: start, lte: end },
    },
  });

  // 4. New Customers
  const newCustomers = await prisma.customer.count({
    where: {
      createdAt: { gte: start, lte: end },
    },
  });

  return { revenue, estimatedProfit, completedOrders, newCustomers };
}

export async function getOverviewReport(params: OverviewReportParams): Promise<OverviewReportData> {
  const { startDate, endDate, comparisonStartDate, comparisonEndDate } = params;

  const current = await getPeriodMetrics(startDate, endDate);

  let previous = { revenue: 0, estimatedProfit: 0, completedOrders: 0, newCustomers: 0 };
  if (comparisonStartDate && comparisonEndDate) {
    previous = await getPeriodMetrics(comparisonStartDate, comparisonEndDate);
  }

  // Stock status is current, not per period
  const [stockAgg, lowStockCount] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { stock: true, costPrice: true },
    }),
    prisma.product.count({
      where: {
        isActive: true,
        stock: { lte: prisma.product.fields.minStock },
      },
    }),
  ]);

  const totalStockValue = stockAgg.reduce((acc, p) => {
    return acc + p.stock * decimalToNumber(p.costPrice);
  }, 0);

  const calculateChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    revenue: {
      current: current.revenue,
      previous: previous.revenue,
      change: calculateChange(current.revenue, previous.revenue),
    },
    estimatedProfit: {
      current: current.estimatedProfit,
      previous: previous.estimatedProfit,
      change: calculateChange(current.estimatedProfit, previous.estimatedProfit),
    },
    completedOrders: {
      current: current.completedOrders,
      previous: previous.completedOrders,
      change: calculateChange(current.completedOrders, previous.completedOrders),
    },
    newCustomers: {
      current: current.newCustomers,
      previous: previous.newCustomers,
      change: calculateChange(current.newCustomers, previous.newCustomers),
    },
    stockStatus: {
      totalValue: totalStockValue,
      lowStockCount,
    },
    generatedAt: new Date().toISOString(),
  };
}
