import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import logger from "../utils/logger";
import {
  getArgentinaStartOfDay,
  getArgentinaEndOfDay,
} from "@/lib/utils/date";

const todayRange = () => {
  const today = getArgentinaStartOfDay();
  const tomorrow = getArgentinaEndOfDay();
  return { today, tomorrow };
};

export const getCashStatusTool = tool({
  description:
    "Consulta el estado actual de la caja: ingresos, egresos, saldo y cantidad de movimientos del día.",
  inputSchema: z.object({}),
  execute: async () => {
    logger.debug("Get cash status");
    const { today, tomorrow } = todayRange();

    const movements = await prisma.cash_movement.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
    });

    const totalIncome = movements
      .filter((m) => m.type === "INCOME")
      .reduce((s, m) => s + Number(m.amount), 0);
    const totalExpense = movements
      .filter((m) => m.type === "EXPENSE")
      .reduce((s, m) => s + Number(m.amount), 0);

    if (movements.length === 0) {
      return "🔴 No hay movimientos registrados hoy. La caja no se ha abierto aún.";
    }

    return `💰 Resumen de caja\n- Ingresos: $${totalIncome}\n- Egresos: $${totalExpense}\n- Saldo: $${totalIncome - totalExpense}\n- Movimientos: ${movements.length}`;
  },
});

export const getTodaySummaryTool = tool({
  description:
    "Resumen del día actual: ventas directas (cantidad y total), OTs creadas, y movimientos de caja (ingresos, egresos, neto).",
  inputSchema: z.object({}),
  execute: async () => {
    logger.debug("Get today summary");
    const { today, tomorrow } = todayRange();

    const sales = await prisma.direct_sale.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
    });

    const totalSales = sales.reduce((s, sale) => s + Number(sale.total), 0);
    const salesCount = sales.length;

    const workOrders = await prisma.work_order.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
    });

    const cashMovements = await prisma.cash_movement.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
    });

    const totalIncome = cashMovements
      .filter((m) => m.type === "INCOME")
      .reduce((s, m) => s + Number(m.amount), 0);
    const totalExpense = cashMovements
      .filter((m) => m.type === "EXPENSE")
      .reduce((s, m) => s + Number(m.amount), 0);

    return `📊 Resumen del día\n\n💰 Ventas directas: ${salesCount} = $${totalSales}\n🔧 OTs creadas: ${workOrders.length}\n💵 Caja:\n  Ingresos: $${totalIncome}\n  Egresos: $${totalExpense}\n  Neto: $${totalIncome - totalExpense}`;
  },
});

export const createDirectSaleTool = tool({
  description:
    'Registra una venta directa (mostrador). Requiere ID de producto, cantidad, precio unitario, nombre del cliente y método de pago. Método de pago: "contado", "tarjeta" o "transferencia" (se resuelve automáticamente). Debe llamarse solo después de que el usuario confirma explícitamente.',
  inputSchema: z.object({
    productId: z.string().describe("ID del producto"),
    productName: z.string().describe("Nombre del producto visible"),
    quantity: z.number().min(1).describe("Cantidad vendida"),
    unitPrice: z.number().min(0).describe("Precio unitario de venta"),
    paymentMethod: z
      .string()
      .describe('Método de pago: "contado", "tarjeta" o "transferencia"'),
    customerName: z
      .string()
      .describe('Nombre del cliente (o "Mostrador" para venta sin cliente)'),
    customerId: z
      .string()
      .nullable()
      .optional()
      .describe("ID del cliente (opcional, null para consumidor final)"),
    notes: z.string().optional().describe("Notas de la venta"),
    createdBy: z
      .string()
      .optional()
      .describe("ID del usuario que registra la venta (del runtime USER_ID, si está disponible)"),
  }),
  execute: async (input) => {
    logger.debug(
      { productId: input.productId, quantity: input.quantity },
      "Create direct sale",
    );

    try {
      const product = await prisma.product.findUnique({
        where: { id: input.productId },
        select: { name: true, stock: true },
      });

      if (!product) return "Producto no encontrado.";
      if (Number(product.stock) < input.quantity)
        return `Stock insuficiente. Disponible: ${product.stock}, solicitado: ${input.quantity}`;

      // Resolve payment method by name
      const pm = await prisma.payment_method.findFirst({
        where: { name: { contains: input.paymentMethod, mode: "insensitive" } },
      });
      if (!pm) {
        const allPms = await prisma.payment_method.findMany();
        return `Método de pago "${input.paymentMethod}" no encontrado. Disponibles: ${allPms.map((p) => p.name).join(", ")}`;
      }

      const totalPrice = input.quantity * input.unitPrice;

      const sale = await prisma.direct_sale.create({
        data: {
          id: randomUUID(),
          customerId: input.customerId ?? null,
          customerName: input.customerName,
          total: totalPrice,
          notes: input.notes ?? "",
          createdBy: input.createdBy || "nitro-bot",
          items: {
            create: [
              {
                id: randomUUID(),
                productId: input.productId,
                name: input.productName || product.name,
                quantity: input.quantity,
                unitPrice: input.unitPrice,
                totalPrice,
              },
            ],
          },
          payments: {
            create: [
              {
                id: randomUUID(),
                paymentMethodId: pm.id,
                amount: totalPrice,
                notes: input.notes ?? "",
                createdBy: input.createdBy || "nitro-bot",
              },
            ],
          },
        },
        include: { items: true, payments: true },
      });

      await prisma.product.update({
        where: { id: input.productId },
        data: {
          stock: { decrement: input.quantity },
          lastMovementAt: new Date(),
        },
      });

      return `✅ Venta registrada:\n- Producto: ${input.productName || product.name} x${input.quantity}\n- Total: $${totalPrice}\n- Cliente: ${input.customerName}\n- Pago: ${pm.name}\n- ID: ${sale.id.slice(0, 8)}`;
    } catch (error) {
      logger.error({ error }, "Error creating direct sale");
      return `Error al registrar venta: ${error instanceof Error ? error.message : "Error desconocido"}`;
    }
  },
});

export const financeTools = {
  getCashStatus: getCashStatusTool,
  getTodaySummary: getTodaySummaryTool,
  createDirectSale: createDirectSaleTool,
};
