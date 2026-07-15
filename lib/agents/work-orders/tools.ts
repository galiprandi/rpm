import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { updateWorkOrder } from "@/lib/services/workOrderService";
import logger from "../utils/logger";

export const searchWorkOrdersTool = tool({
  description:
    'Busca órdenes de trabajo por estado, nombre de cliente o ID de cliente. Usá customerName para buscar por nombre del cliente (ej: "Aliprandi").',
  inputSchema: z.object({
    status: z
      .string()
      .optional()
      .describe(
        "Filtrar por estado (WAITING, CONFIRMED, IN_PROGRESS, QC_CHECK, READY, PAID, DELIVERED)",
      ),
    customerName: z
      .string()
      .optional()
      .describe('Nombre del cliente (búsqueda parcial, ej: "Aliprandi")'),
    customerId: z.string().optional().describe("ID del cliente"),
    limit: z
      .number()
      .optional()
      .describe("Cantidad máxima de resultados (default 10)"),
  }),
  execute: async ({ status, customerName, customerId, limit }) => {
    logger.debug({ status, customerName, customerId }, "Search work orders");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (customerName) {
      where.customer = {
        name: { contains: customerName, mode: "insensitive" },
      };
    }

    const orders = await prisma.work_order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, identifier: true, category: true } },
        work_order_item: { select: { quantity: true, unitPrice: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit ?? 10,
    });

    if (orders.length === 0) return "No se encontraron órdenes de trabajo.";

    return (
      orders
        .map((o) => {
          const itemCount = o.work_order_item?.length || 0;
          return `🔹 OT #${o.id.slice(0, 8)} - ${o.status} - ${o.customer?.name || "?"} - ${o.vehicle?.identifier || "?"} - $${Number(o.total)}${itemCount > 0 ? ` (${itemCount} items)` : ""}`;
        })
        .join("\n") + `\n\n${orders.length} OT(s) encontrada(s).`
    );
  },
});

export const createWorkOrderTool = tool({
  description:
    "Crea una orden de trabajo (OT). Requiere ID del cliente y del vehículo. Opcionalmente puede incluir items y fecha programada.",
  inputSchema: z.object({
    customerId: z.string().describe("ID del cliente"),
    vehicleId: z.string().describe("ID del vehículo"),
    notes: z.string().optional().describe("Notas o descripción del trabajo"),
    scheduledDate: z
      .string()
      .optional()
      .describe("Fecha programada (ISO string)"),
  }),
  execute: async (input) => {
    logger.debug(
      { customerId: input.customerId, vehicleId: input.vehicleId },
      "Create work order",
    );

    const workOrder = await prisma.work_order.create({
      data: {
        id: randomUUID(),
        customerId: input.customerId,
        vehicleId: input.vehicleId,
        status: input.scheduledDate ? "CONFIRMED" : "WAITING",
        notes: input.notes || "",
        total: 0,
        totalProducts: 0,
        totalServices: 0,
        scheduledDate: input.scheduledDate
          ? new Date(input.scheduledDate)
          : null,
        updatedAt: new Date(),
      },
      include: {
        customer: { select: { name: true } },
        vehicle: { select: { identifier: true, category: true } },
      },
    });

    return `✅ OT creada:\n- ID: ${workOrder.id.slice(0, 8)}\n- Cliente: ${(workOrder as any).customer?.name}\n- Vehículo: ${(workOrder as any).vehicle?.identifier}\n- Estado: ${workOrder.status}\n- Total: $0 (sin items aún)`;
  },
});

export const updateWorkOrderStatusTool = tool({
  description:
    "Actualiza el estado de una orden de trabajo. Estados válidos: WAITING, CONFIRMED, IN_PROGRESS, QC_CHECK, READY, PAID, DELIVERED.",
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
      .describe("Nuevo estado"),
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
          userId: "bot",
          userEmail: "nitro@rpm",
        },
      );
      return `✅ OT #${input.workOrderId.slice(0, 8)} actualizada a: ${input.status}`;
    } catch (error) {
      return `Error al actualizar OT: ${error instanceof Error ? error.message : "Error desconocido"}`;
    }
  },
});

export const getWorkOrderDetailTool = tool({
  description: "Obtiene el detalle completo de una orden de trabajo por su ID.",
  inputSchema: z.object({
    workOrderId: z.string().describe("ID de la orden de trabajo"),
  }),
  execute: async ({ workOrderId }) => {
    logger.debug({ workOrderId }, "Get work order detail");

    const wo = await prisma.work_order.findUnique({
      where: { id: workOrderId },
      include: {
        customer: { select: { name: true, phone: true } },
        vehicle: {
          select: {
            identifier: true,
            category: true,
            vehicle_make: { select: { name: true } },
            vehicle_model: { select: { name: true } },
          },
        },
        work_order_item: {
          include: {
            product: { select: { name: true } },
            service: { select: { name: true } },
          },
        },
        payments: { select: { amount: true } },
        technician: { select: { name: true } },
      },
    });

    if (!wo) return "OT no encontrada.";

    const totalPaid = wo.payments.reduce((s, p) => s + Number(p.amount), 0);
    const itemsStr = wo.work_order_item
      .map(
        (i) =>
          `  ${i.type === "PRODUCT" ? i.product?.name || "?" : i.service?.name || "?"} x${i.quantity} = $${Number(i.subtotal)}`,
      )
      .join("\n");

    return `📋 OT #${wo.id.slice(0, 8)}\n- Cliente: ${wo.customer.name}\n- Vehículo: ${wo.vehicle.identifier} (${wo.vehicle.category})\n- Estado: ${wo.status}\n- Técnico: ${wo.technician?.name || "Sin asignar"}\n- Total: $${Number(wo.total)}\n- Pagado: $${totalPaid}\n- Saldo: $${Number(wo.total) - totalPaid}\n${itemsStr ? `\nItems:\n${itemsStr}` : "\nSin items"}`;
  },
});

export const workOrderTools = {
  searchWorkOrders: searchWorkOrdersTool,
  createWorkOrder: createWorkOrderTool,
  updateWorkOrderStatus: updateWorkOrderStatusTool,
  getWorkOrderDetail: getWorkOrderDetailTool,
};
