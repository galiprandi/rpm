import { prisma } from "@/lib/prisma";
import { ARGENTINA_TIMEZONE } from "@/lib/utils/date";

export type PurchaseGroupBy = "hour" | "day" | "month";

export interface PurchaseReportParams {
  startDate: Date;
  endDate: Date;
  comparisonStartDate?: Date;
  comparisonEndDate?: Date;
  groupBy?: PurchaseGroupBy;
}

export interface PurchaseMetric {
  current: number;
  previous: number;
  change: number;
}

export interface PurchaseEvolutionItem {
  date: string;
  label: string;
  total: number;
  count: number;
}

export interface SupplierPurchaseItem {
  supplierId: string;
  supplierName: string;
  total: number;
  count: number;
}

export interface PurchaseReportData {
  totalPurchases: PurchaseMetric;
  voucherCount: PurchaseMetric;
  averageVoucher: PurchaseMetric;
  evolution: PurchaseEvolutionItem[];
  supplierDistribution: SupplierPurchaseItem[];
  groupBy: PurchaseGroupBy;
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
 * Gets purchase metrics for a specific period
 */
async function getPurchasePeriodMetrics(start: Date, end: Date) {
  const aggregate = await prisma.purchase_voucher.aggregate({
    where: {
      status: "FINALIZED",
      date: { gte: start, lte: end },
    },
    _sum: { totalAmount: true },
    _count: { id: true },
  });

  const total = decimalToNumber(aggregate._sum.totalAmount);
  const count = aggregate._count.id;
  const average = count > 0 ? total / count : 0;

  return { total, count, average };
}

function determineGroupBy(startDate: Date, endDate: Date): PurchaseGroupBy {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 1) return "hour";
  if (diffDays <= 31) return "day";
  return "month";
}

function getBucketKeyAndLabel(
  date: Date,
  groupBy: PurchaseGroupBy,
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
  groupBy: PurchaseGroupBy,
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
      startParts.find((p) => p.type === "year")?.value || "2024",
      10,
    );
    const startM =
      parseInt(startParts.find((p) => p.type === "month")?.value || "1", 10) -
      1;
    const endY = parseInt(
      endParts.find((p) => p.type === "year")?.value || "2024",
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
 * Generates a purchase report with comparison
 */
export async function getPurchaseReport(
  params: PurchaseReportParams,
): Promise<PurchaseReportData> {
  const { startDate, endDate, comparisonStartDate, comparisonEndDate } = params;
  const groupBy = params.groupBy || determineGroupBy(startDate, endDate);

  // 1. Get current period metrics
  const current = await getPurchasePeriodMetrics(startDate, endDate);

  // 2. Get previous period metrics if comparison is requested
  let previous = { total: 0, count: 0, average: 0 };
  if (comparisonStartDate && comparisonEndDate) {
    previous = await getPurchasePeriodMetrics(
      comparisonStartDate,
      comparisonEndDate,
    );
  }

  // 3. Get vouchers for evolution and supplier distribution
  const vouchers = await prisma.purchase_voucher.findMany({
    where: {
      status: "FINALIZED",
      date: { gte: startDate, lte: endDate },
    },
    include: {
      supplier: true,
    },
  });

  const buckets = initializeBuckets(startDate, endDate, groupBy);
  const supplierMap: Record<string, SupplierPurchaseItem> = {};

  vouchers.forEach((v) => {
    const amount = decimalToNumber(v.totalAmount);

    // Evolution
    const { key } = getBucketKeyAndLabel(v.date, groupBy);
    if (buckets[key]) {
      buckets[key].total += amount;
      buckets[key].count += 1;
    }

    // Supplier Distribution
    if (!supplierMap[v.supplierId]) {
      supplierMap[v.supplierId] = {
        supplierId: v.supplierId,
        supplierName: v.supplier.name,
        total: 0,
        count: 0,
      };
    }
    supplierMap[v.supplierId].total += amount;
    supplierMap[v.supplierId].count += 1;
  });

  const evolution = Object.values(buckets)
    .map((b) => ({
      date: b.key,
      label: b.label,
      total: b.total,
      count: b.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const supplierDistribution = Object.values(supplierMap).sort(
    (a, b) => b.total - a.total,
  );

  // 4. Format results
  const calculateChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    totalPurchases: {
      current: current.total,
      previous: previous.total,
      change: calculateChange(current.total, previous.total),
    },
    voucherCount: {
      current: current.count,
      previous: previous.count,
      change: calculateChange(current.count, previous.count),
    },
    averageVoucher: {
      current: current.average,
      previous: previous.average,
      change: calculateChange(current.average, previous.average),
    },
    evolution,
    supplierDistribution,
    groupBy,
    generatedAt: new Date().toISOString(),
  };
}
