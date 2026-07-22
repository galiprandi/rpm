import { db } from "@/lib/db";
import {
  workOrder,
  directSale,
  workOrderItem,
  directSaleItem,
  product,
  service,
  category,
  user,
} from "@/db/schema";
import { and, inArray, gte, lte, eq, sum } from "drizzle-orm";
import { ARGENTINA_TIMEZONE } from "@/lib/utils/date";

export type ProfitabilityGroupBy = "hour" | "day" | "month";

export interface ProfitabilityReportParams {
  startDate: Date;
  endDate: Date;
  comparisonStartDate?: Date;
  comparisonEndDate?: Date;
  groupBy?: ProfitabilityGroupBy;
}

export interface ProfitabilityMetric {
  current: number;
  previous: number;
  change: number;
}

export interface ProfitabilityEvolutionItem {
  date: string;
  label: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface CategoryProfitabilityItem {
  id: string;
  name: string;
  revenue: number;
  profit: number;
  margin: number;
}

export interface TopProfitableItem {
  id: string;
  name: string;
  profit: number;
  margin: number;
  quantity: number;
}

export interface TechnicianProfitability {
  technicianId: string;
  technicianName: string;
  revenue: number;
  profit: number;
  margin: number;
}

export interface ProfitabilityReportData {
  revenue: ProfitabilityMetric;
  totalCost: ProfitabilityMetric;
  grossProfit: ProfitabilityMetric;
  grossMargin: ProfitabilityMetric;
  evolution: ProfitabilityEvolutionItem[];
  categoryProfitability: CategoryProfitabilityItem[];
  topProfitableItems: TopProfitableItem[];
  technicianProfitability: TechnicianProfitability[];
  groupBy: ProfitabilityGroupBy;
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
 * Gets profitability metrics for a specific period
 */
async function getProfitabilityPeriodMetrics(start: Date, end: Date) {
  const saleStatuses = ["DELIVERED", "READY", "PAID"];
  const startStr = start.toISOString();
  const endStr = end.toISOString();
  // 1. Revenue
  const [woSales, dsSales] = await Promise.all([
    db.select({ totalSum: sum(workOrder.total) }).from(workOrder).where(and(
      inArray(workOrder.status, saleStatuses),
      gte(workOrder.completedAt, startStr),
      lte(workOrder.completedAt, endStr),
    )),
    db.select({ totalSum: sum(directSale.total) }).from(directSale).where(and(
      gte(directSale.createdAt, startStr),
      lte(directSale.createdAt, endStr),
    )),
  ]);

  const revenue = decimalToNumber(woSales[0]?.totalSum) + decimalToNumber(dsSales[0]?.totalSum);

  // 2. Cost (COGS)
  const [woItems, dsItems] = await Promise.all([
    db.select({
      productId: workOrderItem.productId,
      serviceId: workOrderItem.serviceId,
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
      gte(workOrder.completedAt, startStr),
      lte(workOrder.completedAt, endStr),
    )),
    db.select({
      productId: directSaleItem.productId,
      serviceId: directSaleItem.serviceId,
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
      gte(directSale.createdAt, startStr),
      lte(directSale.createdAt, endStr),
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

  const grossProfit = revenue - totalCost;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return { revenue, totalCost, grossProfit, grossMargin };
}

function determineGroupBy(startDate: Date, endDate: Date): ProfitabilityGroupBy {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 1) return "hour";
  if (diffDays <= 31) return "day";
  return "month";
}

function getBucketKeyAndLabel(
  date: Date,
  groupBy: ProfitabilityGroupBy,
): { key: string; label: string } {
  if (groupBy === "hour") {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: ARGENTINA_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const y = parts.find((p) => p.type === "year")?.value || "";
    const m = parts.find((p) => p.type === "month")?.value || "";
    const d = parts.find((p) => p.type === "day")?.value || "";
    const h = parts.find((p) => p.type === "hour")?.value || "00";
    return { key: `${y}-${m}-${d} ${h}:00`, label: `${h}:00` };
  }
  if (groupBy === "month") {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: ARGENTINA_TIMEZONE,
      year: "numeric",
      month: "2-digit",
    });
    const key = formatter.format(date);
    const monthNames = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
    ];
    const parts = formatter.formatToParts(date);
    const m = parseInt(parts.find((p) => p.type === "month")?.value || "1", 10) - 1;
    return { key, label: monthNames[m] };
  }
  // day
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: ARGENTINA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const key = formatter.format(date);
  const parts = formatter.formatToParts(date);
  const m = parts.find((p) => p.type === "month")?.value || "";
  const d = parts.find((p) => p.type === "day")?.value || "";
  return { key, label: `${d}/${m}` };
}

function initializeBuckets(
  startDate: Date,
  endDate: Date,
  groupBy: ProfitabilityGroupBy,
): Record<string, { revenue: number; cost: number; profit: number; label: string; key: string }> {
  const buckets: Record<string, { revenue: number; cost: number; profit: number; label: string; key: string }> = {};

  if (groupBy === "hour") {
    const ptr = new Date(startDate);
    while (ptr <= endDate) {
      const { key, label } = getBucketKeyAndLabel(ptr, groupBy);
      if (!buckets[key]) buckets[key] = { revenue: 0, cost: 0, profit: 0, label, key };
      ptr.setHours(ptr.getHours() + 1);
    }
  } else if (groupBy === "month") {
    const startParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: ARGENTINA_TIMEZONE,
      year: "numeric",
      month: "2-digit",
    }).formatToParts(startDate);
    const endParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: ARGENTINA_TIMEZONE,
      year: "numeric",
      month: "2-digit",
    }).formatToParts(endDate);
    const startY = parseInt(startParts.find((p) => p.type === "year")?.value || "2024", 10);
    const startM = parseInt(startParts.find((p) => p.type === "month")?.value || "1", 10) - 1;
    const endY = parseInt(endParts.find((p) => p.type === "year")?.value || "2024", 10);
    const endM = parseInt(endParts.find((p) => p.type === "month")?.value || "1", 10) - 1;
    const monthNames = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
    ];
    let y = startY, m = startM;
    while (y < endY || (y === endY && m <= endM)) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      buckets[key] = { revenue: 0, cost: 0, profit: 0, label: monthNames[m], key };
      m++;
      if (m > 11) { m = 0; y++; }
    }
  } else {
    const ptr = new Date(startDate);
    while (ptr <= endDate) {
      const { key, label } = getBucketKeyAndLabel(ptr, groupBy);
      if (!buckets[key]) buckets[key] = { revenue: 0, cost: 0, profit: 0, label, key };
      ptr.setDate(ptr.getDate() + 1);
    }
  }

  return buckets;
}

export async function getProfitabilityReport(params: ProfitabilityReportParams): Promise<ProfitabilityReportData> {
  const { startDate, endDate, comparisonStartDate, comparisonEndDate } = params;
  const groupBy = params.groupBy || determineGroupBy(startDate, endDate);

  // 1. Current and Previous Period Metrics
  const current = await getProfitabilityPeriodMetrics(startDate, endDate);
  let previous = { revenue: 0, totalCost: 0, grossProfit: 0, grossMargin: 0 };
  if (comparisonStartDate && comparisonEndDate) {
    previous = await getProfitabilityPeriodMetrics(comparisonStartDate, comparisonEndDate);
  }

  // 2. Fetch Detailed Items for Distributions and Evolution
  const saleStatuses = ["DELIVERED", "READY", "PAID"];
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();
  const [woItems, dsItems] = await Promise.all([
    db.select({
      subtotal: workOrderItem.subtotal,
      productId: workOrderItem.productId,
      serviceId: workOrderItem.serviceId,
      quantity: workOrderItem.quantity,
      productName: product.name,
      productCostPrice: product.costPrice,
      productCategoryId: product.categoryId,
      categoryName: category.name,
      serviceName: service.name,
      serviceBaseCost: service.baseCost,
      technicianId: workOrder.technicianId,
      technicianName: user.name,
      completedAt: workOrder.completedAt,
    }).from(workOrderItem).innerJoin(
      workOrder, eq(workOrderItem.workOrderId, workOrder.id),
    ).leftJoin(
      product, eq(workOrderItem.productId, product.id),
    ).leftJoin(
      category, eq(product.categoryId, category.id),
    ).leftJoin(
      service, eq(workOrderItem.serviceId, service.id),
    ).leftJoin(
      user, eq(workOrder.technicianId, user.id),
    ).where(and(
      inArray(workOrder.status, saleStatuses),
      gte(workOrder.completedAt, startDateStr),
      lte(workOrder.completedAt, endDateStr),
    )),
    db.select({
      totalPrice: directSaleItem.totalPrice,
      productId: directSaleItem.productId,
      serviceId: directSaleItem.serviceId,
      quantity: directSaleItem.quantity,
      itemName: directSaleItem.name,
      productName: product.name,
      productCostPrice: product.costPrice,
      productCategoryId: product.categoryId,
      categoryName: category.name,
      serviceName: service.name,
      serviceBaseCost: service.baseCost,
      createdAt: directSale.createdAt,
    }).from(directSaleItem).innerJoin(
      directSale, eq(directSaleItem.directSaleId, directSale.id),
    ).leftJoin(
      product, eq(directSaleItem.productId, product.id),
    ).leftJoin(
      category, eq(product.categoryId, category.id),
    ).leftJoin(
      service, eq(directSaleItem.serviceId, service.id),
    ).where(and(
      gte(directSale.createdAt, startDateStr),
      lte(directSale.createdAt, endDateStr),
    )),
  ]);

  const buckets = initializeBuckets(startDate, endDate, groupBy);
  const categoryMap: Record<string, CategoryProfitabilityItem> = {};
  const productMap: Record<string, TopProfitableItem> = {};
  const technicianMap: Record<string, TechnicianProfitability> = {};

  const processItem = (
    id: string,
    name: string,
    revenue: number,
    cost: number,
    quantity: number,
    categoryId: string,
    categoryName: string,
    techId?: string | null,
    techName?: string | null,
    date?: Date
  ) => {
    const profit = revenue - cost;

    // Evolution
    if (date) {
      const { key } = getBucketKeyAndLabel(date, groupBy);
      if (buckets[key]) {
        buckets[key].revenue += revenue;
        buckets[key].cost += cost;
        buckets[key].profit += profit;
      }
    }

    // Category
    if (!categoryMap[categoryId]) {
      categoryMap[categoryId] = { id: categoryId, name: categoryName, revenue: 0, profit: 0, margin: 0 };
    }
    categoryMap[categoryId].revenue += revenue;
    categoryMap[categoryId].profit += profit;

    // Product/Service
    if (!productMap[id]) {
      productMap[id] = { id, name, profit: 0, margin: 0, quantity: 0 };
    }
    productMap[id].profit += profit;
    productMap[id].quantity += quantity;

    // Technician
    if (techId) {
      if (!technicianMap[techId]) {
        technicianMap[techId] = { technicianId: techId, technicianName: techName || "Sin Nombre", revenue: 0, profit: 0, margin: 0 };
      }
      technicianMap[techId].revenue += revenue;
      technicianMap[techId].profit += profit;
    }
  };

  woItems.forEach((item) => {
    const revenue = decimalToNumber(item.subtotal);
    const unitCost = item.productId
      ? decimalToNumber(item.productCostPrice)
      : decimalToNumber(item.serviceBaseCost);
    const cost = unitCost * item.quantity;

    const id = item.productId || item.serviceId || "unknown";
    const name = item.productName || item.serviceName || "Desconocido";
    const categoryId = item.productId ? item.productCategoryId || "p-uncat" : "services-cat";
    const categoryName = item.productId ? item.categoryName || "Productos s/cat" : "Servicios";
    const techId = item.technicianId;
    const techName = item.technicianName;
    const date = item.completedAt ? new Date(item.completedAt) : new Date();

    processItem(id, name, revenue, cost, item.quantity, categoryId, categoryName, techId, techName, date);
  });

  dsItems.forEach((item) => {
    const revenue = decimalToNumber(item.totalPrice);
    const unitCost = item.productId
      ? decimalToNumber(item.productCostPrice)
      : decimalToNumber(item.serviceBaseCost);
    const cost = unitCost * item.quantity;

    const id = item.productId || item.serviceId || "unknown";
    const name = item.productName || item.serviceName || item.itemName || "Desconocido";
    const categoryId = item.productId ? item.productCategoryId || "p-uncat" : "services-cat";
    const categoryName = item.productId ? item.categoryName || "Productos s/cat" : "Servicios (Venta Directa)";
    const date = new Date(item.createdAt);

    processItem(id, name, revenue, cost, item.quantity, categoryId, categoryName, null, null, date);
  });

  // Calculate final margins for maps
  Object.values(categoryMap).forEach(c => {
    c.margin = c.revenue > 0 ? (c.profit / c.revenue) * 100 : 0;
  });
  // Actually, let's keep it simple. If we want item margin, we need item revenue.
  // Re-adjusting processItem to track revenue for products too.

  const finalProductMap: Record<string, {id: string, name: string, revenue: number, profit: number, quantity: number}> = {};
  woItems.forEach(item => {
    const rev = decimalToNumber(item.subtotal);
    const id = item.productId || item.serviceId || "unknown";
    const name = item.productName || item.serviceName || "Desconocido";
    const unitCost = item.productId ? decimalToNumber(item.productCostPrice) : decimalToNumber(item.serviceBaseCost);
    const cost = unitCost * item.quantity;
    if (!finalProductMap[id]) finalProductMap[id] = {id, name, revenue: 0, profit: 0, quantity: 0};
    finalProductMap[id].revenue += rev;
    finalProductMap[id].profit += (rev - cost);
    finalProductMap[id].quantity += item.quantity;
  });
  dsItems.forEach(item => {
    const rev = decimalToNumber(item.totalPrice);
    const id = item.productId || item.serviceId || "unknown";
    const name = item.productName || item.serviceName || item.itemName || "Desconocido";
    const unitCost = item.productId ? decimalToNumber(item.productCostPrice) : decimalToNumber(item.serviceBaseCost);
    const cost = unitCost * item.quantity;
    if (!finalProductMap[id]) finalProductMap[id] = {id, name, revenue: 0, profit: 0, quantity: 0};
    finalProductMap[id].revenue += rev;
    finalProductMap[id].profit += (rev - cost);
    finalProductMap[id].quantity += item.quantity;
  });

  const topProfitableItems: TopProfitableItem[] = Object.values(finalProductMap)
    .map(p => ({
      id: p.id,
      name: p.name,
      profit: p.profit,
      margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
      quantity: p.quantity
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);

  Object.values(technicianMap).forEach(t => {
    t.margin = t.revenue > 0 ? (t.profit / t.revenue) * 100 : 0;
  });

  const evolution = Object.values(buckets)
    .map(b => ({
      date: b.key,
      label: b.label,
      revenue: b.revenue,
      cost: b.cost,
      profit: b.profit
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

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
    totalCost: {
      current: current.totalCost,
      previous: previous.totalCost,
      change: calculateChange(current.totalCost, previous.totalCost),
    },
    grossProfit: {
      current: current.grossProfit,
      previous: previous.grossProfit,
      change: calculateChange(current.grossProfit, previous.grossProfit),
    },
    grossMargin: {
      current: current.grossMargin,
      previous: previous.grossMargin,
      change: calculateChange(current.grossMargin, previous.grossMargin),
    },
    evolution,
    categoryProfitability: Object.values(categoryMap).sort((a, b) => b.profit - a.profit),
    topProfitableItems,
    technicianProfitability: Object.values(technicianMap).sort((a, b) => b.profit - a.profit),
    groupBy,
    generatedAt: new Date().toISOString(),
  };
}
