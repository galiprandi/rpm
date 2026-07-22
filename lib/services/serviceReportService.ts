import { db } from "@/lib/db";
import {
  workOrder,
  directSale,
  workOrderItem,
  directSaleItem,
  service,
  vehicle,
  user,
} from "@/db/schema";
import { and, inArray, gte, lte, eq, isNotNull, sum, count } from "drizzle-orm";
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
  const saleStatuses = ["DELIVERED", "READY", "PAID"];
  const startStr = start.toISOString();
  const endStr = end.toISOString();
  const [woItems, dsItems] = await Promise.all([
    db.select({
      subtotalSum: sum(workOrderItem.subtotal),
      idCount: count(workOrderItem.id),
    }).from(workOrderItem).innerJoin(
      workOrder, eq(workOrderItem.workOrderId, workOrder.id),
    ).where(and(
      isNotNull(workOrderItem.serviceId),
      inArray(workOrder.status, saleStatuses),
      gte(workOrder.completedAt, startStr),
      lte(workOrder.completedAt, endStr),
    )),
    db.select({
      totalPriceSum: sum(directSaleItem.totalPrice),
      idCount: count(directSaleItem.id),
    }).from(directSaleItem).innerJoin(
      directSale, eq(directSaleItem.directSaleId, directSale.id),
    ).where(and(
      isNotNull(directSaleItem.serviceId),
      gte(directSale.createdAt, startStr),
      lte(directSale.createdAt, endStr),
    )),
  ]);

  const total =
    decimalToNumber(woItems[0]?.subtotalSum) +
    decimalToNumber(dsItems[0]?.totalPriceSum);
  const countVal = Number(woItems[0]?.idCount ?? 0) + Number(dsItems[0]?.idCount ?? 0);
  const average = countVal > 0 ? total / countVal : 0;

  return { total, count: countVal, average };
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
  const saleStatuses = ["DELIVERED", "READY", "PAID"];
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();
  const [woItems, dsItems] = await Promise.all([
    db.select({
      subtotal: workOrderItem.subtotal,
      serviceId: workOrderItem.serviceId,
      quantity: workOrderItem.quantity,
      serviceName: service.name,
      technicianId: workOrder.technicianId,
      technicianName: user.name,
      vehicleCategory: vehicle.category,
      completedAt: workOrder.completedAt,
    }).from(workOrderItem).innerJoin(
      workOrder, eq(workOrderItem.workOrderId, workOrder.id),
    ).leftJoin(
      service, eq(workOrderItem.serviceId, service.id),
    ).leftJoin(
      user, eq(workOrder.technicianId, user.id),
    ).leftJoin(
      vehicle, eq(workOrder.vehicleId, vehicle.id),
    ).where(and(
      isNotNull(workOrderItem.serviceId),
      inArray(workOrder.status, saleStatuses),
      gte(workOrder.completedAt, startDateStr),
      lte(workOrder.completedAt, endDateStr),
    )),
    db.select({
      totalPrice: directSaleItem.totalPrice,
      serviceId: directSaleItem.serviceId,
      quantity: directSaleItem.quantity,
      itemName: directSaleItem.name,
      serviceName: service.name,
      createdAt: directSale.createdAt,
    }).from(directSaleItem).innerJoin(
      directSale, eq(directSaleItem.directSaleId, directSale.id),
    ).leftJoin(
      service, eq(directSaleItem.serviceId, service.id),
    ).where(and(
      isNotNull(directSaleItem.serviceId),
      gte(directSale.createdAt, startDateStr),
      lte(directSale.createdAt, endDateStr),
    )),
  ]);

  const serviceMap: Record<string, TopServiceItem> = {};
  const categoryMap: Record<string, VehicleCategoryDistributionItem> = {};
  const technicianMap: Record<string, TechnicianServicePerformance> = {};
  const buckets = initializeBuckets(startDate, endDate, groupBy);

  // Process Work Order items
  woItems.forEach((item) => {
    const total = decimalToNumber(item.subtotal);
    const serviceName = item.serviceName || "Servicio Desconocido";
    const serviceId = item.serviceId || "unknown";

    // Top services
    if (!serviceMap[serviceId]) {
      serviceMap[serviceId] = { id: serviceId, name: serviceName, total: 0, quantity: 0 };
    }
    serviceMap[serviceId].total += total;
    serviceMap[serviceId].quantity += item.quantity;

    // Category distribution
    const category = item.vehicleCategory || "Otros";
    if (!categoryMap[category]) {
      categoryMap[category] = { category, total: 0, count: 0 };
    }
    categoryMap[category].total += total;
    categoryMap[category].count += item.quantity;

    // Technician performance
    const techId = item.technicianId || "no-tech";
    const techName = item.technicianName || "Sin Asignar";
    if (!technicianMap[techId]) {
      technicianMap[techId] = { technicianId: techId, technicianName: techName, totalRevenue: 0, serviceCount: 0 };
    }
    technicianMap[techId].totalRevenue += total;
    technicianMap[techId].serviceCount += item.quantity;

    // Evolution
    const date = item.completedAt ? new Date(item.completedAt) : new Date();
    const { key } = getBucketKeyAndLabel(date, groupBy);
    if (buckets[key]) {
      buckets[key].total += total;
      buckets[key].count += item.quantity;
    }
  });

  // Process Direct Sale items
  dsItems.forEach((item) => {
    const total = decimalToNumber(item.totalPrice);
    const serviceName = item.serviceName || item.itemName || "Servicio Desconocido";
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
    const date = new Date(item.createdAt);
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
