import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import { workOrder, customer, vehicle, workOrderItem, product, service, payment, user } from "@/db/schema";
import { eq, and, ilike, desc, or, type SQL } from "drizzle-orm";
import { randomUUID } from "crypto";
import { updateWorkOrder } from "@/lib/services/workOrderService";
import logger from "../utils/logger";

export const searchWorkOrdersTool = tool({
  description:
    'Busca órdenes de trabajo por estado, nombre de cliente o ID de cliente. Devuelve ID, estado, cliente, vehículo, total y cantidad de items. Usar customerName para buscar por nombre del cliente (ej: "Aliprandi").',
  inputSchema: z.object({
    status: z
      .string()
      .optional()
      .describe(
        "Filtrar por estado: WAITING, CONFIRMED, IN_PROGRESS, QC_CHECK, READY, PAID, DELIVERED",
      ),
    customerName: z
      .string()
      .optional()
      .describe("Nombre del cliente (búsqueda parcial, ej: \"Aliprandi\")"),
    customerId: z.string().optional().describe("ID del cliente"),
    limit: z
      .number()
      .optional()
      .describe("Cantidad máxima de resultados (default: 10)"),
  }),
  execute: async ({ status, customerName, customerId, limit }) => {
    logger.debug({ status, customerName, customerId }, "Search work orders");

    const conditions: SQL[] = [];
    if (status) conditions.push(eq(workOrder.status, status));
    if (customerId) conditions.push(eq(workOrder.customerId, customerId));
    if (customerName) conditions.push(ilike(customer.name, `%${customerName}%`));

    const orders = await db.query.workOrder.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        customer: true,
        vehicle: true,
        workOrderItems: true,
      },
      orderBy: desc(workOrder.createdAt),
      limit: limit ?? 10,
    });

    if (orders.length === 0) return "No se encontraron órdenes de trabajo.";

    return (
      orders
        .map((o) => {
          const itemCount = o.workOrderItems?.length || 0;
          return `🔹 OT #${o.id.slice(0, 8)} - ${o.status} - ${o.customer?.name || "?"} - ${o.vehicle?.identifier || "?"} - $${Number(o.total)}${itemCount > 0 ? ` (${itemCount} items)` : ""}`;
        })
        .join("\n") + `\n\n${orders.length} OT(s) encontrada(s).`
    );
  },
});

export const createWorkOrderTool = tool({
  description:
    "Crea una orden de trabajo (OT). Requiere ID del cliente y ID del vehículo. Opcionalmente notas y fecha programada. Debe llamarse solo después de que el usuario confirma explícitamente.",
  inputSchema: z.object({
    customerId: z.string().describe("ID del cliente"),
    vehicleId: z.string().describe("ID del vehículo"),
    notes: z.string().optional().describe("Notas o descripción del trabajo"),
    scheduledDate: z
      .string()
      .optional()
      .describe("Fecha programada (formato ISO, ej: 2026-07-20)"),
  }),
  execute: async (input) => {
    logger.debug(
      { customerId: input.customerId, vehicleId: input.vehicleId },
      "Create work order",
    );

    const [workOrderRecord] = await db
      .insert(workOrder)
      .values({
        id: randomUUID(),
        customerId: input.customerId,
        vehicleId: input.vehicleId,
        status: input.scheduledDate ? "CONFIRMED" : "WAITING",
        notes: input.notes || "",
        total: "0",
        totalProducts: "0",
        totalServices: "0",
        scheduledDate: input.scheduledDate
          ? new Date(input.scheduledDate).toISOString()
          : null,
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const customerRecord = await db.query.customer.findFirst({
      where: eq(customer.id, input.customerId),
    });
    const vehicleRecord = await db.query.vehicle.findFirst({
      where: eq(vehicle.id, input.vehicleId),
    });

    return `✅ OT creada:\n- ID: ${workOrderRecord.id.slice(0, 8)}\n- Cliente: ${customerRecord?.name}\n- Vehículo: ${vehicleRecord?.identifier}\n- Estado: ${workOrderRecord.status}\n- Total: $0 (sin items aún)`;
  },
});

export const updateWorkOrderStatusTool = tool({
  description:
    "Actualiza el estado de una orden de trabajo. Estados válidos: WAITING, CONFIRMED, IN_PROGRESS, QC_CHECK, READY, PAID, DELIVERED. Debe llamarse solo después de que el usuario confirma explícitamente.",
  inputSchema: z.object({
    workOrderId: z.string().describe("ID de la orden de trabajo"),
    status: z
      .enum([
        "WAITING",
        "CONFIRMED",
        "IN_PROGRESS",
        "QC_CHECK",
        "READY",
        "PAID",
        "DELIVERED",
      ])
      .describe("Nuevo estado de la OT"),
    userId: z
      .string()
      .optional()
      .describe("ID del usuario que realiza el cambio (del runtime USER_ID, si está disponible)"),
    userEmail: z
      .string()
      .optional()
      .describe("Email del usuario que realiza el cambio (si está disponible)"),
  }),
  execute: async (input) => {
    logger.debug(
      { workOrderId: input.workOrderId, status: input.status },
      "Update work order status",
    );

    try {
      const updated = await updateWorkOrder(
        input.workOrderId,
        { status: input.status },
        {
          userId: input.userId || "bot",
          userEmail: input.userEmail || "nitro@rpm",
        },
      );
      return `✅ OT #${input.workOrderId.slice(0, 8)} actualizada a: ${input.status}`;
    } catch (error) {
      return `Error al actualizar OT: ${error instanceof Error ? error.message : "Error desconocido"}`;
    }
  },
});

export const getWorkOrderDetailTool = tool({
  description: "Obtiene el detalle completo de una orden de trabajo: cliente, vehículo, estado, técnico, total, pagado, saldo e items.",
  inputSchema: z.object({
    workOrderId: z.string().describe("ID de la orden de trabajo"),
  }),
  execute: async ({ workOrderId }) => {
    logger.debug({ workOrderId }, "Get work order detail");

    const wo = await db.query.workOrder.findFirst({
      where: eq(workOrder.id, workOrderId),
      with: {
        customer: true,
        vehicle: {
          with: {
            vehicleMake: true,
            vehicleModel: true,
          },
        },
        workOrderItems: {
          with: {
            product: true,
            service: true,
          },
        },
        payments: true,
      },
    });

    if (!wo) return "OT no encontrada.";

    // technician is a userId reference - fetch user if technicianId is set
    let technicianName: string | null = null;
    if (wo.technicianId) {
      const technician = await db.query.user.findFirst({
        where: eq(user.id, wo.technicianId),
      });
      technicianName = technician?.name ?? null;
    }

    const totalPaid = wo.payments.reduce((s, p) => s + Number(p.amount), 0);
    const itemsStr = wo.workOrderItems
      .map(
        (i) =>
          `  ${i.type === "PRODUCT" ? i.product?.name || "?" : i.service?.name || "?"} x${i.quantity} = $${Number(i.subtotal)}`,
      )
      .join("\n");

    return `📋 OT #${wo.id.slice(0, 8)}\n- Cliente: ${wo.customer.name}\n- Vehículo: ${wo.vehicle.identifier} (${wo.vehicle.category})\n- Estado: ${wo.status}\n- Técnico: ${technicianName || "Sin asignar"}\n- Total: $${Number(wo.total)}\n- Pagado: $${totalPaid}\n- Saldo: $${Number(wo.total) - totalPaid}\n${itemsStr ? `\nItems:\n${itemsStr}` : "\nSin items"}`;
  },
});

export const workOrderTools = {
  searchWorkOrders: searchWorkOrdersTool,
  createWorkOrder: createWorkOrderTool,
  updateWorkOrderStatus: updateWorkOrderStatusTool,
  getWorkOrderDetail: getWorkOrderDetailTool,
};
