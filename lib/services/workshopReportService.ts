import { prisma } from "@/lib/prisma";
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
  const [totalOrders, completedOrders, resolutionTimes] = await Promise.all([
    prisma.work_order.count({
      where: {
        createdAt: { gte: start, lte: end },
      },
    }),
    prisma.work_order.count({
      where: {
        completedAt: { gte: start, lte: end },
        status: { in: ["READY", "DELIVERED", "PAID"] },
      },
    }),
    prisma.work_order.findMany({
      where: {
        completedAt: { gte: start, lte: end },
        status: { in: ["READY", "DELIVERED", "PAID"] },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    }),
  ]);

  let avgResolutionTime = 0;
  if (resolutionTimes.length > 0) {
    const totalTimeMs = resolutionTimes.reduce((acc, curr) => {
      const completed = curr.completedAt?.getTime() || 0;
      const created = curr.createdAt.getTime();
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
  const statusCounts = await prisma.work_order.groupBy({
    by: ['status'],
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: {
      id: true,
    },
  });

  const statusDistribution: WorkshopStatusDistribution[] = statusCounts.map((sc) => ({
    status: sc.status,
    count: sc._count.id,
    label: STATUS_LABELS[sc.status] || sc.status,
  })).sort((a, b) => b.count - a.count);

  // 4. Technician Performance
  const technicians = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'STAFF'] },
      work_orders: {
        some: {
          createdAt: { gte: startDate, lte: endDate },
        },
      },
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          work_orders: {
            where: {
              createdAt: { gte: startDate, lte: endDate },
            },
          },
        },
      },
    },
  });

  // Get completed counts per technician
  const completedCounts = await prisma.work_order.groupBy({
    by: ['technicianId'],
    where: {
      technicianId: { not: null },
      completedAt: { gte: startDate, lte: endDate },
      status: { in: ["READY", "DELIVERED", "PAID"] },
    },
    _count: {
      id: true,
    },
  });

  const technicianPerformance: TechnicianPerformance[] = technicians.map((t) => {
    const completed = completedCounts.find((cc) => cc.technicianId === t.id)?._count.id || 0;
    return {
      technicianId: t.id,
      technicianName: t.name,
      assignedCount: t._count.work_orders,
      completedCount: completed,
    };
  }).sort((a, b) => b.completedCount - a.completedCount);

  // 5. Evolution
  const [createdEvolution, completedEvolution] = await Promise.all([
    prisma.work_order.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
    }),
    prisma.work_order.findMany({
      where: {
        completedAt: { gte: startDate, lte: endDate },
        status: { in: ["READY", "DELIVERED", "PAID"] },
      },
      select: { completedAt: true },
    }),
  ]);

  const buckets = initializeBuckets(startDate, endDate, groupBy);

  createdEvolution.forEach((wo) => {
    const { key } = getBucketKeyAndLabel(wo.createdAt, groupBy);
    if (buckets[key]) buckets[key].created += 1;
  });

  completedEvolution.forEach((wo) => {
    if (wo.completedAt) {
      const { key } = getBucketKeyAndLabel(wo.completedAt, groupBy);
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
