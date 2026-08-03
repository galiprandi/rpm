import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import { workOrder, customer, vehicle, workOrderItem, product, service, payment, user, paymentMethod, photo } from "@/db/schema";
import { eq, and, ilike, desc, or, sql, type SQL } from "drizzle-orm";
import { DEFAULT_ENTRY_CHECKLIST, DEFAULT_EXIT_CHECKLIST } from "@/lib/constants/work-order";
import { randomUUID } from "crypto";
import { updateWorkOrder } from "@/lib/services/workOrderService";
import logger from "../utils/logger";
import { isCashRegisterOpen, createCashMovement } from "@/lib/services/cashMovementService";
import { adjustBalanceAtomically } from "@/lib/services/balanceService";
import { invalidateCashStatus } from "@/lib/cache";

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

export const registerWorkOrderPaymentTool = tool({
  description:
    "Registra un pago para una orden de trabajo (OT). Requiere ID de la orden de trabajo, monto, método de pago y notas opcionales. Debe llamarse solo después de que el usuario confirma explícitamente.",
  inputSchema: z.object({
    workOrderId: z.string().describe("ID de la orden de trabajo"),
    amount: z.number().min(0.01).describe("Monto a pagar"),
    paymentMethod: z
      .string()
      .describe('Método de pago: "contado", "tarjeta", "transferencia" u otro similar'),
    notes: z.string().optional().describe("Notas opcionales sobre el pago"),
    userId: z
      .string()
      .optional()
      .describe(
        "ID del usuario que realiza la operación (del runtime USER_ID, si está disponible)",
      ),
  }),
  execute: async (input) => {
    logger.debug(
      { workOrderId: input.workOrderId, amount: input.amount, paymentMethod: input.paymentMethod },
      "Register work order payment",
    );

    try {
      // 1. Check if cash register is open
      const isOpen = await isCashRegisterOpen();
      if (!isOpen) {
        return "🔴 La caja está cerrada. Debe abrir la caja para registrar pagos.";
      }

      // 2. Verify work order exists
      const workOrderRecord = await db.query.workOrder.findFirst({
        where: eq(workOrder.id, input.workOrderId),
        columns: { id: true, total: true, customerId: true, status: true },
        with: {
          customer: { columns: { name: true } },
          payments: { columns: { amount: true } },
        },
      });

      if (!workOrderRecord) {
        return "🔴 Orden de trabajo no encontrada.";
      }

      // 3. Resolve payment method by name
      const pm = await db.query.paymentMethod.findFirst({
        where: ilike(paymentMethod.name, `%${input.paymentMethod}%`),
      });

      if (!pm) {
        const allPms = await db.query.paymentMethod.findMany({
          where: eq(paymentMethod.isActive, true),
        });
        return `🔴 Método de pago "${input.paymentMethod}" no encontrado. Disponibles: ${allPms.map((p) => p.name).join(", ")}`;
      }

      if (!pm.isActive) {
        return `🔴 El método de pago "${pm.name}" no está activo.`;
      }

      const totalPaidBefore = workOrderRecord.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const remainingAmount = Number(workOrderRecord.total) - totalPaidBefore;

      if (remainingAmount <= 0) {
        return `ℹ️ La OT #${input.workOrderId.slice(0, 8)} ya se encuentra completamente pagada.`;
      }

      const paymentAmount = Math.min(input.amount, remainingAmount);

      // 4. Perform transaction
      const paymentId = randomUUID();
      await db.transaction(async (tx) => {
        // Create payment
        await tx.insert(payment).values({
          id: paymentId,
          workOrderId: input.workOrderId,
          paymentMethodId: pm.id,
          amount: paymentAmount.toString(),
          notes: input.notes ?? "",
          createdBy: input.userId || "nitro-bot",
        });

        // Create cash movement
        await createCashMovement(
          {
            type: "INCOME",
            amount: paymentAmount,
            method: pm.code,
            referenceId: paymentId,
            referenceType: "work_order_payment",
            reason: `Pago OT #${input.workOrderId.slice(0, 8)}`,
            createdBy: input.userId || "nitro-bot",
          },
          tx,
        );

        // Update customer balance atomically
        if (workOrderRecord.customerId) {
          await adjustBalanceAtomically(
            workOrderRecord.customerId,
            -paymentAmount,
            "payment",
            tx,
          );
        }
      });

      // 5. Payment status is tracked via isFullyPaid (computed from payments) and
      // shown with color-coded badges in the kanban. We intentionally do NOT change
      // the work order status to "PAID" — "PAID" is not a kanban column, so setting
      // it would make the OT disappear from the board. The OT remains in its current
      // workflow status until manually moved.
      const isFullyPaidNow = totalPaidBefore + paymentAmount >= Number(workOrderRecord.total);

      invalidateCashStatus();

      return `✅ Pago registrado exitosamente:\n- OT: #${input.workOrderId.slice(0, 8)} (${workOrderRecord.customer?.name || "Consumidor Final"})\n- Monto: $${paymentAmount}\n- Método de pago: ${pm.name}\n- Estado de pago: ${isFullyPaidNow ? "Totalmente pagada" : `Pendiente ($${(remainingAmount - paymentAmount).toFixed(2)} restantes)`}`;
    } catch (error) {
      logger.error({ error }, "Error registering work order payment");
      return `🔴 Error al registrar el pago: ${error instanceof Error ? error.message : "Error desconocido"}`;
    }
  },
});

export const attachPhotoToChecklistItemTool = tool({
  description:
    "Asocia o adjunta una foto a un ítem específico del checklist de ingreso (ENTRY) o salida/calidad (EXIT) de una orden de trabajo. Requiere ID de la OT, el tipo de checklist, el ID del ítem y la URL de la foto.",
  inputSchema: z.object({
    workOrderId: z.string().describe("ID de la orden de trabajo"),
    checklistType: z.enum(["ENTRY", "EXIT"]).describe("Tipo de checklist: ENTRY (Ingreso) o EXIT (Salida)"),
    itemId: z.string().describe("ID del ítem del checklist (ej: 'exterior_clean', 'tires', 'lights', etc.) o búsqueda parcial de su etiqueta (ej: 'luces', 'neumáticos', 'Limpieza exterior')"),
    url: z.string().describe("URL de la foto adjunta"),
    description: z.string().optional().describe("Descripción opcional de la foto"),
  }),
  execute: async ({ workOrderId, checklistType, itemId, url, description }) => {
    logger.debug(
      { workOrderId, checklistType, itemId, url },
      "Attach photo to checklist item",
    );

    try {
      // 1. Fetch work order
      const workOrderRecord = await db.query.workOrder.findFirst({
        where: eq(workOrder.id, workOrderId),
        columns: { id: true, entryChecklist: true, exitChecklist: true },
      });

      if (!workOrderRecord) {
        return `🔴 Orden de trabajo #${workOrderId.slice(0, 8)} no encontrada.`;
      }

      let checklist = checklistType === "ENTRY" ? workOrderRecord.entryChecklist : workOrderRecord.exitChecklist;

      // Initialize checklist if null/empty
      if (!checklist) {
        const defaultItems = checklistType === "ENTRY" ? DEFAULT_ENTRY_CHECKLIST : DEFAULT_EXIT_CHECKLIST;
        checklist = {
          items: defaultItems.map((item) => ({ ...item, checked: false })),
          completedAt: new Date().toISOString(),
        };
      }

      const items = (checklist as any).items || [];

      // Match item smartly: exact ID match first, then partial match on ID, then partial match on label (case-insensitive)
      let targetItem = items.find((i: any) => i.id === itemId);
      if (!targetItem) {
        targetItem = items.find(
          (i: any) =>
            i.id.toLowerCase().includes(itemId.toLowerCase()) ||
            i.label.toLowerCase().includes(itemId.toLowerCase())
        );
      }

      if (!targetItem) {
        const availableItems = items.map((i: any) => `"${i.id}" (${i.label})`).join(", ");
        return `🔴 No se encontró el ítem "${itemId}" en el checklist de ${
          checklistType === "ENTRY" ? "Ingreso" : "Salida"
        }. Ítems disponibles: ${availableItems}`;
      }

      // Associate photoUrl and mark as checked
      targetItem.photoUrl = url;
      targetItem.checked = true;

      // Update checklist
      const updateData =
        checklistType === "ENTRY"
          ? { entryChecklist: checklist as any }
          : { exitChecklist: checklist as any };

      await db.update(workOrder).set(updateData).where(eq(workOrder.id, workOrderId));

      // 2. Create photo record in database
      const photoId = randomUUID();
      await db.insert(photo).values({
        id: photoId,
        workOrderId,
        type: checklistType,
        url,
        description: description || `Foto de checklist: ${targetItem.label}`,
      });

      // 3. Append to work order entryPhotos/exitPhotos array
      const woPhotos = await db.query.workOrder.findFirst({
        where: eq(workOrder.id, workOrderId),
        columns: { entryPhotos: true, exitPhotos: true },
      });

      if (woPhotos) {
        if (checklistType === "ENTRY") {
          const entryPhotos = [...(woPhotos.entryPhotos || []), url];
          await db.update(workOrder).set({ entryPhotos }).where(eq(workOrder.id, workOrderId));
        } else {
          const exitPhotos = [...(woPhotos.exitPhotos || []), url];
          await db.update(workOrder).set({ exitPhotos }).where(eq(workOrder.id, workOrderId));
        }
      }

      return `✅ Foto asociada exitosamente al ítem "${targetItem.label}" del checklist de ${
        checklistType === "ENTRY" ? "Ingreso" : "Salida"
      } para la OT #${workOrderId.slice(0, 8)}.`;
    } catch (error) {
      logger.error({ error }, "Error attaching photo to checklist item");
      return `🔴 Error al asociar la foto al checklist: ${error instanceof Error ? error.message : "Error desconocido"}`;
    }
  },
});

export const workOrderTools = {
  searchWorkOrders: searchWorkOrdersTool,
  createWorkOrder: createWorkOrderTool,
  updateWorkOrderStatus: updateWorkOrderStatusTool,
  getWorkOrderDetail: getWorkOrderDetailTool,
  registerWorkOrderPayment: registerWorkOrderPaymentTool,
  attachPhotoToChecklistItem: attachPhotoToChecklistItemTool,
};
