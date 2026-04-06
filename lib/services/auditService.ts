import { prisma } from "@/lib/prisma";

interface AuditLogEntry {
  workOrderId: string;
  fieldName: string;
  oldValue?: string | number | null;
  newValue?: string | number | null;
  changedBy: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registra un cambio en el historial de auditoría de una OT
 */
export async function logWorkOrderChange(entry: AuditLogEntry) {
  try {
    await prisma.work_order_audit_log.create({
      data: {
        workOrderId: entry.workOrderId,
        fieldName: entry.fieldName,
        oldValue: entry.oldValue !== undefined ? String(entry.oldValue) : null,
        newValue: entry.newValue !== undefined ? String(entry.newValue) : null,
        changedBy: entry.changedBy,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  } catch (error) {
    console.error("Error logging audit entry:", error);
    // No lanzar error para no interrumpir el flujo principal
  }
}

/**
 * Obtiene el historial de cambios de una OT
 */
export async function getWorkOrderAuditLogs(workOrderId: string) {
  try {
    const logs = await prisma.work_order_audit_log.findMany({
      where: { workOrderId },
      orderBy: { changedAt: "desc" },
      take: 100, // Últimos 100 cambios
    });
    return logs;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}
