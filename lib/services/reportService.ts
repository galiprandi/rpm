import { prisma } from "@/lib/prisma";
import { ARGENTINA_TIMEZONE } from "@/lib/utils/date";

export type GroupBy = "hour" | "day" | "month";

export interface SalesReportParams {
  startDate: Date;
  endDate: Date;
  comparisonStartDate?: Date;
  comparisonEndDate?: Date;
  groupBy?: GroupBy;
}

export interface SalesMetric {
  current: number;
  previous: number;
  change: number;
}

export interface SalesEvolutionItem {
  date: string;
  label: string;
  total: number;
  count: number;
}

export interface SalesReportData {
  totalSales: SalesMetric;
  orderCount: SalesMetric;
  ticketAverage: SalesMetric;
  evolution: SalesEvolutionItem[];
  groupBy: GroupBy;
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
 * Gets sales metrics for a specific period
 */
async function getSalesPeriodMetrics(start: Date, end: Date) {
  const [workOrders, directSales] = await Promise.all([
    prisma.work_order.aggregate({
      where: {
        status: { in: ["DELIVERED", "READY", "PAID"] },
        completedAt: { gte: start, lte: end },
      },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.direct_sale.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
      },
      _sum: { total: true },
      _count: { id: true },
    }),
  ]);

  const total =
    decimalToNumber(workOrders._sum.total) +
    decimalToNumber(directSales._sum.total);
  const count = workOrders._count.id + directSales._count.id;
  const average = count > 0 ? total / count : 0;

  return { total, count, average };
}

function determineGroupBy(startDate: Date, endDate: Date): GroupBy {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 1) return "hour";
  if (diffDays <= 31) return "day";
  return "month";
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
): Record<
  string,
  { total: number; count: number; label: string; key: string }
> {
  const buckets: Record<
    string,
    { total: number; count: number; label: string; key: string }
  > = {};

  if (groupBy === "hour") {
    const ptr = new Date(startDate);
    while (ptr <= endDate) {
      const { key, label } = getBucketKeyAndLabel(ptr, groupBy);
      if (!buckets[key]) buckets[key] = { total: 0, count: 0, label, key };
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
    const startY = parseInt(
      startParts.find((p) => p.type === "year")?.value || "2026",
      10,
    );
    const startM =
      parseInt(startParts.find((p) => p.type === "month")?.value || "1", 10) -
      1;
    const endY = parseInt(
      endParts.find((p) => p.type === "year")?.value || "2026",
      10,
    );
    const endM =
      parseInt(endParts.find((p) => p.type === "month")?.value || "1", 10) - 1;
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
    let y = startY,
      m = startM;
    while (y < endY || (y === endY && m <= endM)) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      buckets[key] = { total: 0, count: 0, label: monthNames[m], key };
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
  } else {
    const ptr = new Date(startDate);
    while (ptr <= endDate) {
      const { key, label } = getBucketKeyAndLabel(ptr, groupBy);
      if (!buckets[key]) buckets[key] = { total: 0, count: 0, label, key };
      ptr.setDate(ptr.getDate() + 1);
    }
  }

  return buckets;
}

/**
 * Generates a sales report with comparison
 */
export async function getSalesReport(
  params: SalesReportParams,
): Promise<SalesReportData> {
  const { startDate, endDate, comparisonStartDate, comparisonEndDate } = params;
  const groupBy = params.groupBy || determineGroupBy(startDate, endDate);

  // 1. Get current period metrics
  const current = await getSalesPeriodMetrics(startDate, endDate);

  // 2. Get previous period metrics if comparison is requested
  let previous = { total: 0, count: 0, average: 0 };
  if (comparisonStartDate && comparisonEndDate) {
    previous = await getSalesPeriodMetrics(
      comparisonStartDate,
      comparisonEndDate,
    );
  }

  // 3. Calculate evolution with adaptive grouping
  const [workOrders, directSales] = await Promise.all([
    prisma.work_order.findMany({
      where: {
        status: { in: ["DELIVERED", "READY", "PAID"] },
        completedAt: { gte: startDate, lte: endDate },
      },
      select: {
        total: true,
        completedAt: true,
      },
    }),
    prisma.direct_sale.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        total: true,
        createdAt: true,
      },
    }),
  ]);

  const buckets = initializeBuckets(startDate, endDate, groupBy);

  workOrders.forEach((wo) => {
    const date = wo.completedAt || new Date();
    const { key } = getBucketKeyAndLabel(date, groupBy);
    if (buckets[key]) {
      buckets[key].total += decimalToNumber(wo.total);
      buckets[key].count += 1;
    }
  });

  directSales.forEach((ds) => {
    const { key } = getBucketKeyAndLabel(ds.createdAt, groupBy);
    if (buckets[key]) {
      buckets[key].total += decimalToNumber(ds.total);
      buckets[key].count += 1;
    }
  });

  const evolution = Object.values(buckets)
    .map((b) => ({
      date: b.key,
      label: b.label,
      total: b.total,
      count: b.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 4. Format results
  const calculateChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    totalSales: {
      current: current.total,
      previous: previous.total,
      change: calculateChange(current.total, previous.total),
    },
    orderCount: {
      current: current.count,
      previous: previous.count,
      change: calculateChange(current.count, previous.count),
    },
    ticketAverage: {
      current: current.average,
      previous: previous.average,
      change: calculateChange(current.average, previous.average),
    },
    evolution,
    groupBy,
    generatedAt: new Date().toISOString(),
  };
}
