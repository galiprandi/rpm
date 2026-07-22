import { db } from "@/lib/db";
import {
  workOrder,
  directSale,
  workOrderItem,
  directSaleItem,
  customer,
  product,
  service,
} from "@/db/schema";
import { eq, and, inArray, gte, lte, isNotNull, sql, count, sum } from "drizzle-orm";

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

function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value) || 0;
}

async function getPeriodMetrics(start: Date, end: Date) {
  const saleStatuses = ["DELIVERED", "READY", "PAID"];
  // 1. Revenue
  const [woSales, dsSales] = await Promise.all([
    db.select({ totalSum: sum(workOrder.total) }).from(workOrder).where(and(
      inArray(workOrder.status, saleStatuses),
      gte(workOrder.completedAt, start.toISOString()),
      lte(workOrder.completedAt, end.toISOString()),
    )),
    db.select({ totalSum: sum(directSale.total) }).from(directSale).where(and(
      gte(directSale.createdAt, start.toISOString()),
      lte(directSale.createdAt, end.toISOString()),
    )),
  ]);

  const revenue = decimalToNumber(woSales[0]?.totalSum) + decimalToNumber(dsSales[0]?.totalSum);

  // 2. Estimated Profit (Revenue - Estimated Cost)
  const [woItems, dsItems] = await Promise.all([
    db.select({
      productId: workOrderItem.productId,
      quantity: workOrderItem.quantity,
      productCostPrice: product.costPrice,
      serviceBaseCost: service.baseCost,
    }).from(workOrderItem).innerJoin(
      workOrder, eq(workOrderItem.workOrderId, workOrder.id),
    ).leftJoin(
      product, eq(workOrderItem.productId, product.id),
    ).leftJoin(
      service, eq(workOrderItem.serviceId, service.id),
    ).where(and(
      inArray(workOrder.status, saleStatuses),
      gte(workOrder.completedAt, start.toISOString()),
      lte(workOrder.completedAt, end.toISOString()),
    )),
    db.select({
      productId: directSaleItem.productId,
      quantity: directSaleItem.quantity,
      productCostPrice: product.costPrice,
      serviceBaseCost: service.baseCost,
    }).from(directSaleItem).innerJoin(
      directSale, eq(directSaleItem.directSaleId, directSale.id),
    ).leftJoin(
      product, eq(directSaleItem.productId, product.id),
    ).leftJoin(
      service, eq(directSaleItem.serviceId, service.id),
    ).where(and(
      gte(directSale.createdAt, start.toISOString()),
      lte(directSale.createdAt, end.toISOString()),
    )),
  ]);

  let totalCost = 0;
  woItems.forEach((item) => {
    const unitCost = item.productId
      ? decimalToNumber(item.productCostPrice)
      : decimalToNumber(item.serviceBaseCost);
    totalCost += unitCost * item.quantity;
  });

  dsItems.forEach((item) => {
    const unitCost = item.productId
      ? decimalToNumber(item.productCostPrice)
      : decimalToNumber(item.serviceBaseCost);
    totalCost += unitCost * item.quantity;
  });

  const estimatedProfit = revenue - totalCost;

  // 3. Completed Orders
  const completedOrdersResult = await db.select({ count: count(workOrder.id) })
    .from(workOrder).where(and(
      inArray(workOrder.status, saleStatuses),
      gte(workOrder.completedAt, start.toISOString()),
      lte(workOrder.completedAt, end.toISOString()),
    ));
  const completedOrders = Number(completedOrdersResult[0]?.count ?? 0);

  // 4. New Customers
  const newCustomersResult = await db.select({ count: count(customer.id) })
    .from(customer).where(and(
      gte(customer.createdAt, start.toISOString()),
      lte(customer.createdAt, end.toISOString()),
    ));
  const newCustomers = Number(newCustomersResult[0]?.count ?? 0);

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
  const [stockProducts, lowStockCountResult] = await Promise.all([
    db.select({ stock: product.stock, costPrice: product.costPrice })
      .from(product).where(eq(product.isActive, true)),
    db.select({ count: count(product.id) }).from(product).where(and(
      eq(product.isActive, true),
      sql`${product.stock} <= ${product.minStock}`,
    )),
  ]);

  const totalStockValue = stockProducts.reduce((acc, p) => {
    return acc + p.stock * decimalToNumber(p.costPrice);
  }, 0);

  const lowStockCount = Number(lowStockCountResult[0]?.count ?? 0);

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
