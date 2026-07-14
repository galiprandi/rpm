import { prisma } from "@/lib/prisma";
import { ARGENTINA_TIMEZONE } from "@/lib/utils/date";

export type GroupBy = "hour" | "day" | "month";

export interface CustomerReportParams {
  startDate: Date;
  endDate: Date;
  comparisonStartDate?: Date;
  comparisonEndDate?: Date;
  groupBy?: GroupBy;
}

export interface CustomerMetric {
  current: number;
  previous: number;
  change: number;
}

export interface CustomerEvolutionItem {
  date: string;
  label: string;
  count: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  totalBilling: number;
  ordersCount: number;
  lastOrderDate: string | null;
}

export interface CustomerReportData {
  newCustomers: CustomerMetric;
  activeCustomers: CustomerMetric;
  recurrenceRate: {
    current: number;
    previous: number;
    change: number;
  };
  evolution: CustomerEvolutionItem[];
  topCustomers: TopCustomer[];
  groupBy: GroupBy;
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

async function getNewCustomersCount(start: Date, end: Date) {
  return prisma.customer.count({
    where: {
      createdAt: { gte: start, lte: end },
    },
  });
}

async function getActiveCustomersMetrics(start: Date, end: Date) {
  const [workOrders, directSales] = await Promise.all([
    prisma.work_order.findMany({
      where: {
        completedAt: { gte: start, lte: end },
        status: { in: ["DELIVERED", "READY", "PAID"] },
      },
      select: { customerId: true },
    }),
    prisma.direct_sale.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        customerId: { not: null },
      },
      select: { customerId: true },
    }),
  ]);

  const customerIds = new Set([
    ...workOrders.map((wo) => wo.customerId),
    ...directSales.map((ds) => ds.customerId!).filter(Boolean),
  ]);

  return customerIds.size;
}

async function getRecurrenceMetrics(start: Date, end: Date) {
  // Get all customers who had activity in the period
  const [workOrders, directSales] = await Promise.all([
    prisma.work_order.findMany({
      where: {
        completedAt: { gte: start, lte: end },
        status: { in: ["DELIVERED", "READY", "PAID"] },
      },
      select: { customerId: true },
    }),
    prisma.direct_sale.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        customerId: { not: null },
      },
      select: { customerId: true },
    }),
  ]);

  const activeCustomerIds = Array.from(new Set([
    ...workOrders.map((wo) => wo.customerId),
    ...directSales.map((ds) => ds.customerId!).filter(Boolean),
  ]));

  if (activeCustomerIds.length === 0) return 0;

  // For these active customers, check how many have > 1 total transactions (all time)
  // To avoid N+1 queries, we aggregate for all active customers at once
  const [woCounts, dsCounts] = await Promise.all([
    prisma.work_order.groupBy({
      by: ['customerId'],
      where: {
        customerId: { in: activeCustomerIds },
        status: { in: ["DELIVERED", "READY", "PAID"] }
      },
      _count: { id: true }
    }),
    prisma.direct_sale.groupBy({
      by: ['customerId'],
      where: {
        customerId: { in: activeCustomerIds }
      },
      _count: { id: true }
    })
  ]);

  const totalCounts: Record<string, number> = {};
  woCounts.forEach(c => {
    if (c.customerId) totalCounts[c.customerId] = (totalCounts[c.customerId] || 0) + c._count.id;
  });
  dsCounts.forEach(c => {
    if (c.customerId) totalCounts[c.customerId] = (totalCounts[c.customerId] || 0) + c._count.id;
  });

  const recurringCount = activeCustomerIds.filter(id => (totalCounts[id] || 0) > 1).length;

  return (recurringCount / activeCustomerIds.length) * 100;
}

function getBucketKeyAndLabel(
  date: Date,
  groupBy: GroupBy,
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
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const parts = formatter.formatToParts(date);
    const m =
      parseInt(parts.find((p) => p.type === "month")?.value || "1", 10) - 1;
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
  groupBy: GroupBy,
): Record<string, { count: number; label: string; key: string }> {
  const buckets: Record<string, { count: number; label: string; key: string }> = {};

  if (groupBy === "hour") {
    const ptr = new Date(startDate);
    while (ptr <= endDate) {
      const { key, label } = getBucketKeyAndLabel(ptr, groupBy);
      if (!buckets[key]) buckets[key] = { count: 0, label, key };
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

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    let y = startY, m = startM;
    while (y < endY || (y === endY && m <= endM)) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      buckets[key] = { count: 0, label: monthNames[m], key };
      m++;
      if (m > 11) { m = 0; y++; }
    }
  } else {
    const ptr = new Date(startDate);
    while (ptr <= endDate) {
      const { key, label } = getBucketKeyAndLabel(ptr, groupBy);
      if (!buckets[key]) buckets[key] = { count: 0, label, key };
      ptr.setDate(ptr.getDate() + 1);
    }
  }

  return buckets;
}

export async function getCustomerReport(params: CustomerReportParams): Promise<CustomerReportData> {
  const { startDate, endDate, comparisonStartDate, comparisonEndDate, groupBy: groupByParam } = params;

  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const groupBy = groupByParam || (diffDays <= 1 ? "hour" : diffDays <= 31 ? "day" : "month");

  // 1. Metrics
  const [
    currentNew,
    currentActive,
    currentRecurrence,
    previousNew,
    previousActive,
    previousRecurrence
  ] = await Promise.all([
    getNewCustomersCount(startDate, endDate),
    getActiveCustomersMetrics(startDate, endDate),
    getRecurrenceMetrics(startDate, endDate),
    comparisonStartDate && comparisonEndDate ? getNewCustomersCount(comparisonStartDate, comparisonEndDate) : Promise.resolve(0),
    comparisonStartDate && comparisonEndDate ? getActiveCustomersMetrics(comparisonStartDate, comparisonEndDate) : Promise.resolve(0),
    comparisonStartDate && comparisonEndDate ? getRecurrenceMetrics(comparisonStartDate, comparisonEndDate) : Promise.resolve(0),
  ]);

  const calculateChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  // 2. Evolution (New Customers)
  const newCustomers = await prisma.customer.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    select: { createdAt: true },
  });

  const buckets = initializeBuckets(startDate, endDate, groupBy);
  newCustomers.forEach((c) => {
    const { key } = getBucketKeyAndLabel(c.createdAt, groupBy);
    if (buckets[key]) buckets[key].count += 1;
  });

  const evolution = Object.values(buckets)
    .map((b) => ({
      date: b.key,
      label: b.label,
      count: b.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 3. Top Customers by billing
  // We need to aggregate totals from Work Orders and Direct Sales
  const [woBilling, dsBilling] = await Promise.all([
    prisma.work_order.groupBy({
      by: ['customerId'],
      where: {
        completedAt: { gte: startDate, lte: endDate },
        status: { in: ["DELIVERED", "READY", "PAID"] }
      },
      _sum: { total: true },
      _count: { id: true },
      _max: { completedAt: true }
    }),
    prisma.direct_sale.groupBy({
      by: ['customerId'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        customerId: { not: null }
      },
      _sum: { total: true },
      _count: { id: true },
      _max: { createdAt: true }
    })
  ]);

  const customerStats: Record<string, { total: number; count: number; lastDate: Date }> = {};

  woBilling.forEach(item => {
    if (!item.customerId) return;
    if (!customerStats[item.customerId]) {
      customerStats[item.customerId] = { total: 0, count: 0, lastDate: new Date(0) };
    }
    customerStats[item.customerId].total += decimalToNumber(item._sum.total);
    customerStats[item.customerId].count += item._count.id;
    if (item._max.completedAt && item._max.completedAt > customerStats[item.customerId].lastDate) {
      customerStats[item.customerId].lastDate = item._max.completedAt;
    }
  });

  dsBilling.forEach(item => {
    if (!item.customerId) return;
    if (!customerStats[item.customerId]) {
      customerStats[item.customerId] = { total: 0, count: 0, lastDate: new Date(0) };
    }
    customerStats[item.customerId].total += decimalToNumber(item._sum.total);
    customerStats[item.customerId].count += item._count.id;
    if (item._max.createdAt && item._max.createdAt > customerStats[item.customerId].lastDate) {
      customerStats[item.customerId].lastDate = item._max.createdAt;
    }
  });

  const sortedCustomerIds = Object.keys(customerStats)
    .sort((a, b) => customerStats[b].total - customerStats[a].total)
    .slice(0, 10);

  const topCustomerDetails = await prisma.customer.findMany({
    where: { id: { in: sortedCustomerIds } },
    select: { id: true, name: true }
  });

  const topCustomers: TopCustomer[] = sortedCustomerIds.map(id => {
    const details = topCustomerDetails.find(d => d.id === id);
    return {
      id,
      name: details?.name || 'Cliente Desconocido',
      totalBilling: customerStats[id].total,
      ordersCount: customerStats[id].count,
      lastOrderDate: customerStats[id].lastDate.getTime() > 0 ? customerStats[id].lastDate.toISOString() : null
    };
  });

  return {
    newCustomers: {
      current: currentNew,
      previous: previousNew,
      change: calculateChange(currentNew, previousNew),
    },
    activeCustomers: {
      current: currentActive,
      previous: previousActive,
      change: calculateChange(currentActive, previousActive),
    },
    recurrenceRate: {
      current: currentRecurrence,
      previous: previousRecurrence,
      change: calculateChange(currentRecurrence, previousRecurrence),
    },
    evolution,
    topCustomers,
    groupBy,
    generatedAt: new Date().toISOString(),
  };
}
