import { prisma } from "@/lib/prisma";
import { ARGENTINA_TIMEZONE } from "@/lib/utils/date";

export type ServiceGroupBy = "hour" | "day" | "month";

export interface ServiceReportParams {
  startDate: Date;
  endDate: Date;
  comparisonStartDate?: Date;
  comparisonEndDate?: Date;
  groupBy?: ServiceGroupBy;
}

export interface ServiceMetric {
  current: number;
  previous: number;
  change: number;
}

export interface ServiceEvolutionItem {
  date: string;
  label: string;
  total: number;
  count: number;
}

export interface TopServiceItem {
  id: string;
  name: string;
  total: number;
  quantity: number;
}

export interface VehicleCategoryDistributionItem {
  category: string;
  total: number;
  count: number;
}

export interface TechnicianServicePerformance {
  technicianId: string;
  technicianName: string;
  totalRevenue: number;
  serviceCount: number;
}

export interface ServiceReportData {
  totalServiceRevenue: ServiceMetric;
  serviceCount: ServiceMetric;
  averageServicePrice: ServiceMetric;
  evolution: ServiceEvolutionItem[];
  topServices: TopServiceItem[];
  vehicleCategoryDistribution: VehicleCategoryDistributionItem[];
  technicianPerformance: TechnicianServicePerformance[];
  groupBy: ServiceGroupBy;
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
 * Gets service metrics for a specific period
 */
async function getServicePeriodMetrics(start: Date, end: Date) {
  const [woItems, dsItems] = await Promise.all([
    prisma.work_order_item.aggregate({
      where: {
        serviceId: { not: null },
        work_order: {
          status: { in: ["DELIVERED", "READY", "PAID"] },
          completedAt: { gte: start, lte: end },
        },
      },
      _sum: { subtotal: true },
      _count: { id: true },
    }),
    prisma.direct_sale_item.aggregate({
      where: {
        serviceId: { not: null },
        directSale: {
          createdAt: { gte: start, lte: end },
        },
      },
      _sum: { totalPrice: true },
      _count: { id: true },
    }),
  ]);

  const total =
    decimalToNumber(woItems._sum.subtotal) +
    decimalToNumber(dsItems._sum.totalPrice);
  const count = woItems._count.id + dsItems._count.id;
  const average = count > 0 ? total / count : 0;

  return { total, count, average };
}

function determineGroupBy(startDate: Date, endDate: Date): ServiceGroupBy {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 1) return "hour";
  if (diffDays <= 31) return "day";
  return "month";
}

function getBucketKeyAndLabel(
  date: Date,
  groupBy: ServiceGroupBy,
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
  groupBy: ServiceGroupBy,
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

export async function getServiceReport(
  params: ServiceReportParams,
): Promise<ServiceReportData> {
  const { startDate, endDate, comparisonStartDate, comparisonEndDate } = params;
  const groupBy = params.groupBy || determineGroupBy(startDate, endDate);

  // 1. Current period metrics
  const current = await getServicePeriodMetrics(startDate, endDate);

  // 2. Previous period metrics
  let previous = { total: 0, count: 0, average: 0 };
  if (comparisonStartDate && comparisonEndDate) {
    previous = await getServicePeriodMetrics(
      comparisonStartDate,
      comparisonEndDate,
    );
  }

  // 3. Detailed items for distributions and evolution
  const [woItems, dsItems] = await Promise.all([
    prisma.work_order_item.findMany({
      where: {
        serviceId: { not: null },
        work_order: {
          status: { in: ["DELIVERED", "READY", "PAID"] },
          completedAt: { gte: startDate, lte: endDate },
        },
      },
      include: {
        service: true,
        work_order: {
          include: {
            vehicle: true,
            technician: true,
          },
        },
      },
    }),
    prisma.direct_sale_item.findMany({
      where: {
        serviceId: { not: null },
        directSale: {
          createdAt: { gte: startDate, lte: endDate },
        },
      },
      include: {
        service: true,
        directSale: true,
      },
    }),
  ]);

  const serviceMap: Record<string, TopServiceItem> = {};
  const categoryMap: Record<string, VehicleCategoryDistributionItem> = {};
  const technicianMap: Record<string, TechnicianServicePerformance> = {};
  const buckets = initializeBuckets(startDate, endDate, groupBy);

  // Process Work Order items
  woItems.forEach((item) => {
    const total = decimalToNumber(item.subtotal);
    const serviceName = item.service?.name || "Servicio Desconocido";
    const serviceId = item.serviceId || "unknown";

    // Top services
    if (!serviceMap[serviceId]) {
      serviceMap[serviceId] = { id: serviceId, name: serviceName, total: 0, quantity: 0 };
    }
    serviceMap[serviceId].total += total;
    serviceMap[serviceId].quantity += item.quantity;

    // Category distribution
    const category = item.work_order.vehicle?.category || "Otros";
    if (!categoryMap[category]) {
      categoryMap[category] = { category, total: 0, count: 0 };
    }
    categoryMap[category].total += total;
    categoryMap[category].count += item.quantity;

    // Technician performance
    const techId = item.work_order.technicianId || "no-tech";
    const techName = item.work_order.technician?.name || "Sin Asignar";
    if (!technicianMap[techId]) {
      technicianMap[techId] = { technicianId: techId, technicianName: techName, totalRevenue: 0, serviceCount: 0 };
    }
    technicianMap[techId].totalRevenue += total;
    technicianMap[techId].serviceCount += item.quantity;

    // Evolution
    const date = item.work_order.completedAt || new Date();
    const { key } = getBucketKeyAndLabel(date, groupBy);
    if (buckets[key]) {
      buckets[key].total += total;
      buckets[key].count += item.quantity;
    }
  });

  // Process Direct Sale items
  dsItems.forEach((item) => {
    const total = decimalToNumber(item.totalPrice);
    const serviceName = item.service?.name || item.name || "Servicio Desconocido";
    const serviceId = item.serviceId || "unknown";

    // Top services
    if (!serviceMap[serviceId]) {
      serviceMap[serviceId] = { id: serviceId, name: serviceName, total: 0, quantity: 0 };
    }
    serviceMap[serviceId].total += total;
    serviceMap[serviceId].quantity += item.quantity;

    // Category distribution for Direct Sales is always "Venta Directa" or similar since no vehicle is linked
    const category = "Venta Directa";
    if (!categoryMap[category]) {
      categoryMap[category] = { category, total: 0, count: 0 };
    }
    categoryMap[category].total += total;
    categoryMap[category].count += item.quantity;

    // Evolution
    const date = item.directSale.createdAt;
    const { key } = getBucketKeyAndLabel(date, groupBy);
    if (buckets[key]) {
      buckets[key].total += total;
      buckets[key].count += item.quantity;
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

  const topServices = Object.values(serviceMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const vehicleCategoryDistribution = Object.values(categoryMap).sort(
    (a, b) => b.total - a.total,
  );

  const technicianPerformance = Object.values(technicianMap).sort(
    (a, b) => b.totalRevenue - a.totalRevenue,
  );

  const calculateChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    totalServiceRevenue: {
      current: current.total,
      previous: previous.total,
      change: calculateChange(current.total, previous.total),
    },
    serviceCount: {
      current: current.count,
      previous: previous.count,
      change: calculateChange(current.count, previous.count),
    },
    averageServicePrice: {
      current: current.average,
      previous: previous.average,
      change: calculateChange(current.average, previous.average),
    },
    evolution,
    topServices,
    vehicleCategoryDistribution,
    technicianPerformance,
    groupBy,
    generatedAt: new Date().toISOString(),
  };
}
