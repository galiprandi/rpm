import { prisma } from "@/lib/prisma";
import { ARGENTINA_TIMEZONE } from "@/lib/utils/date";

export type FinanceGroupBy = "hour" | "day" | "month";

export interface FinanceReportParams {
  startDate: Date;
  endDate: Date;
  comparisonStartDate?: Date;
  comparisonEndDate?: Date;
  groupBy?: FinanceGroupBy;
}

export interface FinanceMetric {
  current: number;
  previous: number;
  change: number;
}

export interface FinanceEvolutionItem {
  date: string;
  label: string;
  income: number;
  expenses: number;
}

export interface MethodBreakdown {
  method: string;
  income: number;
  expenses: number;
  net: number;
}

export interface FinanceReportData {
  totalIncome: FinanceMetric;
  totalExpenses: FinanceMetric;
  netFlow: FinanceMetric;
  evolution: FinanceEvolutionItem[];
  methodBreakdown: MethodBreakdown[];
  groupBy: FinanceGroupBy;
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
 * Gets finance metrics for a specific period
 */
async function getFinancePeriodMetrics(start: Date, end: Date) {
  const movements = await prisma.cash_movement.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      type: { in: ["INCOME", "EXPENSE", "PURCHASE_VOUCHER"] },
    },
    select: {
      type: true,
      amount: true,
    },
  });

  let income = 0;
  let expenses = 0;

  movements.forEach((m) => {
    const amount = decimalToNumber(m.amount);
    if (m.type === "INCOME") {
      income += amount;
    } else {
      expenses += amount;
    }
  });

  return { income, expenses, net: income - expenses };
}

function determineGroupBy(startDate: Date, endDate: Date): FinanceGroupBy {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 1) return "hour";
  if (diffDays <= 31) return "day";
  return "month";
}

function getBucketKeyAndLabel(
  date: Date,
  groupBy: FinanceGroupBy,
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
  groupBy: FinanceGroupBy,
): Record<string, { income: number; expenses: number; label: string; key: string }> {
  const buckets: Record<string, { income: number; expenses: number; label: string; key: string }> = {};

  if (groupBy === "hour") {
    const ptr = new Date(startDate);
    while (ptr <= endDate) {
      const { key, label } = getBucketKeyAndLabel(ptr, groupBy);
      if (!buckets[key]) buckets[key] = { income: 0, expenses: 0, label, key };
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
      buckets[key] = { income: 0, expenses: 0, label: monthNames[m], key };
      m++;
      if (m > 11) { m = 0; y++; }
    }
  } else {
    const ptr = new Date(startDate);
    while (ptr <= endDate) {
      const { key, label } = getBucketKeyAndLabel(ptr, groupBy);
      if (!buckets[key]) buckets[key] = { income: 0, expenses: 0, label, key };
      ptr.setDate(ptr.getDate() + 1);
    }
  }

  return buckets;
}

export async function getFinanceReport(params: FinanceReportParams): Promise<FinanceReportData> {
  const { startDate, endDate, comparisonStartDate, comparisonEndDate } = params;
  const groupBy = params.groupBy || determineGroupBy(startDate, endDate);

  // 1. Current period metrics
  const current = await getFinancePeriodMetrics(startDate, endDate);

  // 2. Previous period metrics
  let previous = { income: 0, expenses: 0, net: 0 };
  if (comparisonStartDate && comparisonEndDate) {
    previous = await getFinancePeriodMetrics(comparisonStartDate, comparisonEndDate);
  }

  // 3. Evolution and Method Breakdown
  const movements = await prisma.cash_movement.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      type: { in: ["INCOME", "EXPENSE", "PURCHASE_VOUCHER"] },
    },
    select: {
      type: true,
      amount: true,
      method: true,
      createdAt: true,
    },
  });

  const buckets = initializeBuckets(startDate, endDate, groupBy);
  const methodsMap: Record<string, MethodBreakdown> = {};

  movements.forEach((m) => {
    const amount = decimalToNumber(m.amount);
    const isIncome = m.type === "INCOME";

    // Bucket evolution
    const { key } = getBucketKeyAndLabel(m.createdAt, groupBy);
    if (buckets[key]) {
      if (isIncome) {
        buckets[key].income += amount;
      } else {
        buckets[key].expenses += amount;
      }
    }

    // Method breakdown
    if (!methodsMap[m.method]) {
      methodsMap[m.method] = { method: m.method, income: 0, expenses: 0, net: 0 };
    }
    if (isIncome) {
      methodsMap[m.method].income += amount;
    } else {
      methodsMap[m.method].expenses += amount;
    }
    methodsMap[m.method].net = methodsMap[m.method].income - methodsMap[m.method].expenses;
  });

  const evolution: FinanceEvolutionItem[] = Object.values(buckets)
    .map((b) => ({
      date: b.key,
      label: b.label,
      income: b.income,
      expenses: b.expenses,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const methodBreakdown: MethodBreakdown[] = Object.values(methodsMap)
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  const calculateChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    totalIncome: {
      current: current.income,
      previous: previous.income,
      change: calculateChange(current.income, previous.income),
    },
    totalExpenses: {
      current: current.expenses,
      previous: previous.expenses,
      change: calculateChange(current.expenses, previous.expenses),
    },
    netFlow: {
      current: current.net,
      previous: previous.net,
      change: calculateChange(current.net, previous.net),
    },
    evolution,
    methodBreakdown,
    groupBy,
    generatedAt: new Date().toISOString(),
  };
}
