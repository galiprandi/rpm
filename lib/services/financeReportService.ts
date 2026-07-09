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

export interface PaymentMethodDistribution {
  method: string;
  income: number;
  expense: number;
  net: number;
}

export interface FinanceEvolutionItem {
  date: string;
  label: string;
  income: number;
  expense: number;
}

export interface FinanceReportData {
  totalIncome: FinanceMetric;
  totalExpense: FinanceMetric;
  netFlow: FinanceMetric;
  methodDistribution: PaymentMethodDistribution[];
  evolution: FinanceEvolutionItem[];
  groupBy: FinanceGroupBy;
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

async function getFinancePeriodMetrics(start: Date, end: Date) {
  const movements = await prisma.cash_movement.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      type: { in: ["INCOME", "EXPENSE", "PURCHASE_VOUCHER", "ADJUSTMENT"] },
    },
    select: {
      type: true,
      amount: true,
      reason: true,
    },
  });

  let income = 0;
  let expense = 0;

  movements.forEach((m) => {
    const amount = decimalToNumber(m.amount);
    if (m.type === "INCOME") {
      income += amount;
    } else if (m.type === "EXPENSE" || m.type === "PURCHASE_VOUCHER") {
      expense += amount;
    } else if (m.type === "ADJUSTMENT") {
      if (m.reason?.includes("Sobrante")) {
        income += amount;
      } else if (m.reason?.includes("Faltante")) {
        expense += amount;
      }
    }
  });

  return { income, expense, net: income - expense };
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
): Record<string, { income: number; expense: number; label: string; key: string }> {
  const buckets: Record<string, { income: number; expense: number; label: string; key: string }> = {};

  if (groupBy === "hour") {
    const ptr = new Date(startDate);
    while (ptr <= endDate) {
      const { key, label } = getBucketKeyAndLabel(ptr, groupBy);
      if (!buckets[key]) buckets[key] = { income: 0, expense: 0, label, key };
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
      buckets[key] = { income: 0, expense: 0, label: monthNames[m], key };
      m++;
      if (m > 11) { m = 0; y++; }
    }
  } else {
    const ptr = new Date(startDate);
    while (ptr <= endDate) {
      const { key, label } = getBucketKeyAndLabel(ptr, groupBy);
      if (!buckets[key]) buckets[key] = { income: 0, expense: 0, label, key };
      ptr.setDate(ptr.getDate() + 1);
    }
  }

  return buckets;
}

export async function getFinanceReport(params: FinanceReportParams): Promise<FinanceReportData> {
  const { startDate, endDate, comparisonStartDate, comparisonEndDate } = params;
  const groupBy = params.groupBy || determineGroupBy(startDate, endDate);

  const current = await getFinancePeriodMetrics(startDate, endDate);

  let previous = { income: 0, expense: 0, net: 0 };
  if (comparisonStartDate && comparisonEndDate) {
    previous = await getFinancePeriodMetrics(comparisonStartDate, comparisonEndDate);
  }

  const movements = await prisma.cash_movement.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      type: { in: ["INCOME", "EXPENSE", "PURCHASE_VOUCHER", "ADJUSTMENT"] },
    },
    select: {
      type: true,
      amount: true,
      method: true,
      createdAt: true,
      reason: true,
    },
  });

  const methodMap: Record<string, PaymentMethodDistribution> = {};
  const buckets = initializeBuckets(startDate, endDate, groupBy);

  movements.forEach((m) => {
    const amount = decimalToNumber(m.amount);
    const method = m.method || "N/A";

    if (!methodMap[method]) {
      methodMap[method] = { method, income: 0, expense: 0, net: 0 };
    }

    const { key } = getBucketKeyAndLabel(m.createdAt, groupBy);

    let isIncome = false;
    let isExpense = false;

    if (m.type === "INCOME") {
      isIncome = true;
    } else if (m.type === "EXPENSE" || m.type === "PURCHASE_VOUCHER") {
      isExpense = true;
    } else if (m.type === "ADJUSTMENT") {
      if (m.reason?.includes("Sobrante")) {
        isIncome = true;
      } else if (m.reason?.includes("Faltante")) {
        isExpense = true;
      }
    }

    if (isIncome) {
      methodMap[method].income += amount;
      methodMap[method].net += amount;
      if (buckets[key]) buckets[key].income += amount;
    } else if (isExpense) {
      methodMap[method].expense += amount;
      methodMap[method].net -= amount;
      if (buckets[key]) buckets[key].expense += amount;
    }
  });

  const evolution: FinanceEvolutionItem[] = Object.values(buckets)
    .map((b) => ({
      date: b.key,
      label: b.label,
      income: b.income,
      expense: b.expense,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

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
    totalExpense: {
      current: current.expense,
      previous: previous.expense,
      change: calculateChange(current.expense, previous.expense),
    },
    netFlow: {
      current: current.net,
      previous: previous.net,
      change: calculateChange(current.net, previous.net),
    },
    methodDistribution: Object.values(methodMap).sort((a, b) => b.net - a.net),
    evolution,
    groupBy,
    generatedAt: new Date().toISOString(),
  };
}
