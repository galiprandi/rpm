import { db } from "@/lib/db";
import { workOrder, user } from "@/db/schema";
import { and, inArray, gte, lte, isNotNull, count } from "drizzle-orm";
import { ARGENTINA_TIMEZONE } from "@/lib/utils/date";

export type WorkshopGroupBy = "hour" | "day" | "month";

export interface WorkshopReportParams {
  startDate: Date;
  endDate: Date;
  comparisonStartDate?: Date;
  comparisonEndDate?: Date;
  groupBy?: WorkshopGroupBy;
}

export interface WorkshopMetric {
  current: number;
  previous: number;
  change: number;
}

export interface WorkshopStatusDistribution {
  status: string;
  count: number;
  label: string;
}

export interface TechnicianPerformance {
  technicianId: string;
  technicianName: string;
  assignedCount: number;
  completedCount: number;
}

export interface WorkshopEvolutionItem {
  date: string;
  label: string;
  created: number;
  completed: number;
}

export interface WorkshopReportData {
  totalOrders: WorkshopMetric;
  completedOrders: WorkshopMetric;
  avgResolutionTime: WorkshopMetric; // In hours
  statusDistribution: WorkshopStatusDistribution[];
  technicianPerformance: TechnicianPerformance[];
  evolution: WorkshopEvolutionItem[];
  groupBy: WorkshopGroupBy;
  generatedAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmada",
  WAITING: "En Espera",
  IN_PROGRESS: "En Proceso",
  QC_CHECK: "Control QC",
  READY: "Listo",
  DELIVERED: "Entregada",
};

/**
 * Gets workshop metrics for a specific period
 */
async function getWorkshopPeriodMetrics(start: Date, end: Date) {
  const saleStatuses = ["READY", "DELIVERED", "PAID"];
  const startStr = start.toISOString();
  const endStr = end.toISOString();
  const [totalOrdersResult, completedOrdersResult, resolutionTimes] = await Promise.all([
    db.select({ idCount: count(workOrder.id) }).from(workOrder).where(and(
      gte(workOrder.createdAt, startStr),
      lte(workOrder.createdAt, endStr),
    )),
    db.select({ idCount: count(workOrder.id) }).from(workOrder).where(and(
      gte(workOrder.completedAt, startStr),
      lte(workOrder.completedAt, endStr),
      inArray(workOrder.status, saleStatuses),
    )),
    db.select({
      createdAt: workOrder.createdAt,
      completedAt: workOrder.completedAt,
    }).from(workOrder).where(and(
      gte(workOrder.completedAt, startStr),
      lte(workOrder.completedAt, endStr),
      inArray(workOrder.status, saleStatuses),
    )),
  ]);

  const totalOrders = Number(totalOrdersResult[0]?.idCount ?? 0);
  const completedOrders = Number(completedOrdersResult[0]?.idCount ?? 0);

  let avgResolutionTime = 0;
  if (resolutionTimes.length > 0) {
    const totalTimeMs = resolutionTimes.reduce((acc, curr) => {
      const completed = curr.completedAt ? new Date(curr.completedAt).getTime() : 0;
      const created = new Date(curr.createdAt).getTime();
      return acc + (completed - created);
    }, 0);
    avgResolutionTime = totalTimeMs / resolutionTimes.length / (1000 * 60 * 60); // Convert to hours
  }

  return { totalOrders, completedOrders, avgResolutionTime };
}

function determineGroupBy(startDate: Date, endDate: Date): WorkshopGroupBy {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 1) return "hour";
  if (diffDays <= 31) return "day";
  return "month";
}

function getBucketKeyAndLabel(
  date: Date,
  groupBy: WorkshopGroupBy,
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
  groupBy: WorkshopGroupBy,
): Record<string, { created: number; completed: number; label: string; key: string }> {
  const buckets: Record<string, { created: number; completed: number; label: string; key: string }> = {};

  if (groupBy === "hour") {
    const ptr = new Date(startDate);
    while (ptr <= endDate) {
      const { key, label } = getBucketKeyAndLabel(ptr, groupBy);
      if (!buckets[key]) buckets[key] = { created: 0, completed: 0, label, key };
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
      buckets[key] = { created: 0, completed: 0, label: monthNames[m], key };
      m++;
      if (m > 11) { m = 0; y++; }
    }
  } else {
    const ptr = new Date(startDate);
    while (ptr <= endDate) {
      const { key, label } = getBucketKeyAndLabel(ptr, groupBy);
      if (!buckets[key]) buckets[key] = { created: 0, completed: 0, label, key };
      ptr.setDate(ptr.getDate() + 1);
    }
  }

  return buckets;
}

export async function getWorkshopReport(params: WorkshopReportParams): Promise<WorkshopReportData> {
  const { startDate, endDate, comparisonStartDate, comparisonEndDate } = params;
  const groupBy = params.groupBy || determineGroupBy(startDate, endDate);

  // 1. Current period metrics
  const current = await getWorkshopPeriodMetrics(startDate, endDate);

  // 2. Previous period metrics
  let previous = { totalOrders: 0, completedOrders: 0, avgResolutionTime: 0 };
  if (comparisonStartDate && comparisonEndDate) {
    previous = await getWorkshopPeriodMetrics(comparisonStartDate, comparisonEndDate);
  }

  // 3. Status Distribution (all time current status for OTs created in period? Or all active OTs?)
  // Usually, status distribution is about CURRENT state of OTs within the filtered period.
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();
  const statusCounts = await db.select({
    status: workOrder.status,
    idCount: count(workOrder.id),
  }).from(workOrder).where(and(
    gte(workOrder.createdAt, startDateStr),
    lte(workOrder.createdAt, endDateStr),
  )).groupBy(workOrder.status);

  const statusDistribution: WorkshopStatusDistribution[] = statusCounts.map((sc) => ({
    status: sc.status,
    count: Number(sc.idCount),
    label: STATUS_LABELS[sc.status] || sc.status,
  })).sort((a, b) => b.count - a.count);

  // 4. Technician Performance
  // Get technicians with work orders in the period, along with assigned counts
  const technicianAssignedCounts = await db.select({
    technicianId: workOrder.technicianId,
    idCount: count(workOrder.id),
  }).from(workOrder).where(and(
    gte(workOrder.createdAt, startDateStr),
    lte(workOrder.createdAt, endDateStr),
    isNotNull(workOrder.technicianId),
  )).groupBy(workOrder.technicianId);

  const technicianIds = technicianAssignedCounts
    .map((t) => t.technicianId)
    .filter((id): id is string => id !== null);

  const technicians = technicianIds.length > 0
    ? await db.select({ id: user.id, name: user.name, role: user.role })
        .from(user).where(and(
          inArray(user.id, technicianIds),
          inArray(user.role, ['ADMIN', 'STAFF']),
        ))
    : [];

  // Get completed counts per technician
  const saleStatuses = ["READY", "DELIVERED", "PAID"];
  const completedCounts = await db.select({
    technicianId: workOrder.technicianId,
    idCount: count(workOrder.id),
  }).from(workOrder).where(and(
    isNotNull(workOrder.technicianId),
    gte(workOrder.completedAt, startDateStr),
    lte(workOrder.completedAt, endDateStr),
    inArray(workOrder.status, saleStatuses),
  )).groupBy(workOrder.technicianId);

  const technicianPerformance: TechnicianPerformance[] = technicians.map((t) => {
    const assigned = technicianAssignedCounts.find((ac) => ac.technicianId === t.id);
    const completed = completedCounts.find((cc) => cc.technicianId === t.id);
    return {
      technicianId: t.id,
      technicianName: t.name,
      assignedCount: Number(assigned?.idCount ?? 0),
      completedCount: Number(completed?.idCount ?? 0),
    };
  }).sort((a, b) => b.completedCount - a.completedCount);

  // 5. Evolution
  const [createdEvolution, completedEvolution] = await Promise.all([
    db.select({ createdAt: workOrder.createdAt }).from(workOrder).where(and(
      gte(workOrder.createdAt, startDateStr),
      lte(workOrder.createdAt, endDateStr),
    )),
    db.select({ completedAt: workOrder.completedAt }).from(workOrder).where(and(
      gte(workOrder.completedAt, startDateStr),
      lte(workOrder.completedAt, endDateStr),
      inArray(workOrder.status, saleStatuses),
    )),
  ]);

  const buckets = initializeBuckets(startDate, endDate, groupBy);

  createdEvolution.forEach((wo) => {
    const { key } = getBucketKeyAndLabel(new Date(wo.createdAt), groupBy);
    if (buckets[key]) buckets[key].created += 1;
  });

  completedEvolution.forEach((wo) => {
    if (wo.completedAt) {
      const { key } = getBucketKeyAndLabel(new Date(wo.completedAt), groupBy);
      if (buckets[key]) buckets[key].completed += 1;
    }
  });

  const evolution: WorkshopEvolutionItem[] = Object.values(buckets)
    .map((b) => ({
      date: b.key,
      label: b.label,
      created: b.created,
      completed: b.completed,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const calculateChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    totalOrders: {
      current: current.totalOrders,
      previous: previous.totalOrders,
      change: calculateChange(current.totalOrders, previous.totalOrders),
    },
    completedOrders: {
      current: current.completedOrders,
      previous: previous.completedOrders,
      change: calculateChange(current.completedOrders, previous.completedOrders),
    },
    avgResolutionTime: {
      current: current.avgResolutionTime,
      previous: previous.avgResolutionTime,
      change: calculateChange(current.avgResolutionTime, previous.avgResolutionTime),
    },
    statusDistribution,
    technicianPerformance,
    evolution,
    groupBy,
    generatedAt: new Date().toISOString(),
  };
}
