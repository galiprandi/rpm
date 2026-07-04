import { prisma } from '@/lib/prisma';
import { ARGENTINA_TIMEZONE } from '@/lib/utils/date';

export interface SalesReportParams {
  startDate: Date;
  endDate: Date;
  comparisonStartDate?: Date;
  comparisonEndDate?: Date;
}

export interface SalesMetric {
  current: number;
  previous: number;
  change: number;
}

export interface SalesEvolutionItem {
  date: string;
  total: number;
  count: number;
}

export interface SalesReportData {
  totalSales: SalesMetric;
  orderCount: SalesMetric;
  ticketAverage: SalesMetric;
  evolution: SalesEvolutionItem[];
  generatedAt: string;
}

/**
 * Helper to convert Decimal to number
 */
function decimalToNumber(decimal: unknown): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === 'number') return decimal;
  if (typeof decimal === 'object' && decimal !== null && 'toNumber' in decimal && typeof (decimal as { toNumber: unknown }).toNumber === 'function') {
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
        status: { in: ['DELIVERED', 'READY', 'PAID'] },
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

  const total = decimalToNumber(workOrders._sum.total) + decimalToNumber(directSales._sum.total);
  const count = workOrders._count.id + directSales._count.id;
  const average = count > 0 ? total / count : 0;

  return { total, count, average };
}

/**
 * Generates a sales report with comparison
 */
export async function getSalesReport(params: SalesReportParams): Promise<SalesReportData> {
  const { startDate, endDate, comparisonStartDate, comparisonEndDate } = params;

  // 1. Get current period metrics
  const current = await getSalesPeriodMetrics(startDate, endDate);

  // 2. Get previous period metrics if comparison is requested
  let previous = { total: 0, count: 0, average: 0 };
  if (comparisonStartDate && comparisonEndDate) {
    previous = await getSalesPeriodMetrics(comparisonStartDate, comparisonEndDate);
  }

  // 3. Calculate evolution (daily)
  // Note: For simplicity and to avoid complex group by on dates with timezones in DB,
  // we fetch all items and group in JS for this initial version.
  // In a large DB, this should be a raw SQL query or more optimized.
  const [workOrders, directSales] = await Promise.all([
    prisma.work_order.findMany({
      where: {
        status: { in: ['DELIVERED', 'READY', 'PAID'] },
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

  const dailyData: Record<string, { total: number; count: number }> = {};

  // Formatter for Argentina dates to ensure correct day grouping
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Initialize range
  const currentPtr = new Date(startDate);
  while (currentPtr <= endDate) {
    const dayKey = dateFormatter.format(currentPtr);
    dailyData[dayKey] = { total: 0, count: 0 };
    currentPtr.setDate(currentPtr.getDate() + 1);
  }

  workOrders.forEach(wo => {
    const date = wo.completedAt || new Date();
    const dayKey = dateFormatter.format(date);
    if (dailyData[dayKey]) {
      dailyData[dayKey].total += decimalToNumber(wo.total);
      dailyData[dayKey].count += 1;
    }
  });

  directSales.forEach(ds => {
    const dayKey = dateFormatter.format(ds.createdAt);
    if (dailyData[dayKey]) {
      dailyData[dayKey].total += decimalToNumber(ds.total);
      dailyData[dayKey].count += 1;
    }
  });

  const evolution = Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      total: data.total,
      count: data.count,
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
    generatedAt: new Date().toISOString(),
  };
}
