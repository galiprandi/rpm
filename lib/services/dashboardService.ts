import { prisma } from "@/lib/prisma";
import {
  getArgentinaStartOfDay,
  getArgentinaEndOfDay,
  getArgentinaStartOfYesterday,
} from "@/lib/utils/date";

// Helper para formatear Decimal a number
function decimalToNumber(decimal: unknown): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === "number") return decimal;
  // Prisma Decimal type
  if (
    typeof decimal === "object" &&
    "toNumber" in decimal &&
    typeof (decimal as any).toNumber === "function"
  ) {
    return (decimal as { toNumber: () => number }).toNumber();
  }
  // Handle string values (often returned from raw queries or certain DB adapters)
  if (typeof decimal === "string") {
    return Number(decimal) || 0;
  }
  return 0;
}

export interface DashboardData {
  sales: {
    today: {
      total: number;
      workOrderCount: number;
      vsYesterday: number;
    };
    ticketAverage: number;
  };
  workOrders: {
    active: {
      total: number;
      byStatus: {
        pending: number;
        inProgress: number;
        ready: number;
      };
      newToday: number;
      oldestPending: Array<{
        workOrderId: string;
        vehicleIdentifier: string;
        customerName: string;
        createdAt: string;
      }>;
    };
  };
  stock: {
    lowStockCount: number;
    lowStockItems: Array<{
      id: string;
      name: string;
      stock: number;
      minStock: number;
    }>;
  };
  readyForDelivery: Array<{
    workOrderId: string;
    vehicle: {
      type: "COMPACT" | "SEDAN" | "SUV" | "PICKUP" | "TRUCK";
      description: string;
      identifier: string;
    };
    customer: {
      name: string;
      phone: string;
    };
    total: number;
    totalPaid: number;
    completedAt: string;
    invoiceStatus: "ISSUED" | "PENDING";
  }>;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  debtors: {
    totalDebt: number;
    count: number;
    topDebtors: Array<{
      name: string;
      balance: number;
    }>;
  };
  cashStatus: {
    isOpen: boolean;
    openedAt: string | null;
    balance: number;
  };
  paymentsByMethod?: Array<{
    code: string;
    name: string;
    total: number;
  }>;
  cashMovements?: Array<{
    id: string;
    type: "INCOME" | "EXPENSE" | "OPENING" | "CLOSING";
    amount: number;
    method: string;
    methodName: string;
    referenceId?: string;
    referenceType?: string;
    reason?: string;
    createdAt: string;
    createdBy: string;
    customer?: {
      id: string;
      name: string;
    };
  }>;
  generatedAt: string;
}

export interface DailyOperationsData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    byMethod: Array<{
      method: string;
      methodName: string;
      amount: number;
    }>;
  };
  movements: Array<{
    id: string;
    type:
      | "INCOME"
      | "EXPENSE"
      | "OPENING"
      | "CLOSING"
      | "ADJUSTMENT"
      | "PURCHASE_VOUCHER";
    amount: number;
    method: string;
    methodName: string;
    referenceId?: string;
    referenceType?: string;
    reason?: string;
    notes?: string;
    createdAt: string;
    createdBy: string;
    customer?: {
      id: string;
      name: string;
    };
    relatedId?: string; // ID de la OT o Venta Directa
    relatedType?: "work_order" | "direct_sale";
  }>;
}

/**
 * Obtiene datos del dashboard para administradores
 *
 * Esta función puede ser usada por:
 * - Server Components (app/adm/page.tsx)
 * - API Routes (app/api/dashboard/summary/route.ts)
 * - AI Agents como tool
 *
 * @returns Datos del dashboard con métricas de ventas, OTs, stock, etc.
 */
export async function getDashboardData(): Promise<DashboardData> {
  // Obtener fecha de hoy y ayer en zona horaria de Argentina
  const today = getArgentinaStartOfDay();
  const yesterday = getArgentinaStartOfYesterday();

  // Optimized: Use aggregate queries instead of findMany + reduce
  // Reduces from 5 queries to 4 more efficient ones
  const [
    todaySalesAgg,
    yesterdaySalesAgg,
    activeWorkOrdersAgg,
    todayDirectSalesAgg,
    yesterdayDirectSalesAgg,
  ] = await Promise.all([
    // 1. Ventas del día (aggregate)
    prisma.work_order.aggregate({
      where: {
        status: { in: ["DELIVERED", "READY", "PAID"] },
        completedAt: { gte: today },
      },
      _sum: { total: true },
      _count: { id: true },
    }),
    // 2. Ventas de ayer (aggregate)
    prisma.work_order.aggregate({
      where: {
        status: { in: ["DELIVERED", "READY", "PAID"] },
        completedAt: { gte: yesterday, lt: today },
      },
      _sum: { total: true },
    }),
    // 3. OTs Activas - solo conteos por status
    prisma.work_order.groupBy({
      by: ["status"],
      where: {
        status: {
          in: ["CONFIRMED", "WAITING", "IN_PROGRESS", "CONTROL_QC", "READY"],
        },
      },
      _count: { id: true },
    }),
    // 4. Ventas directas del día (aggregate)
    prisma.direct_sale.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { total: true },
      _count: { id: true },
    }),
    // 5. Ventas directas de ayer (aggregate) — fix vsYesterday comparison
    prisma.direct_sale.aggregate({
      where: { createdAt: { gte: yesterday, lt: today } },
      _sum: { total: true },
    }),
  ]);

  // Ejecutar queries restantes secuencialmente para reducir carga de conexiones
  const lowStockProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { lte: prisma.product.fields.minStock },
    },
    select: {
      id: true,
      name: true,
      stock: true,
      minStock: true,
    },
    take: 5,
    orderBy: { stock: "asc" },
  });

  const readyWorkOrders = await prisma.work_order.findMany({
    where: {
      status: "READY",
    },
    include: {
      customer: {
        select: { name: true, phone: true },
      },
      vehicle: {
        select: { category: true, description: true, identifier: true },
      },
      payments: {
        select: { amount: true },
      },
    },
    take: 5,
    orderBy: { completedAt: "desc" },
  });

  // Oldest pending work orders (CONFIRMED / WAITING) for prioritization
  const oldestPendingWorkOrders = await prisma.work_order.findMany({
    where: {
      status: { in: ["CONFIRMED", "WAITING"] },
    },
    include: {
      customer: { select: { name: true } },
      vehicle: { select: { identifier: true } },
    },
    take: 2,
    orderBy: { createdAt: "asc" },
  });

  // Top products sold today (from direct_sale_item + work_order_item)
  const [todayDirectSaleItems, todayWorkOrderItems] = await Promise.all([
    prisma.direct_sale_item.findMany({
      where: {
        directSale: { createdAt: { gte: today } },
        productId: { not: null },
      },
      select: {
        name: true,
        quantity: true,
        totalPrice: true,
        productId: true,
      },
    }),
    prisma.work_order_item.findMany({
      where: {
        work_order: {
          completedAt: { gte: today },
          status: { in: ["DELIVERED", "READY", "PAID"] },
        },
        productId: { not: null },
      },
      select: {
        quantity: true,
        subtotal: true,
        product: { select: { name: true } },
      },
    }),
  ]);

  // Aggregate top products by name
  const productMap = new Map<string, { quantity: number; revenue: number }>();
  for (const item of todayDirectSaleItems) {
    const key = item.name;
    const existing = productMap.get(key) || { quantity: 0, revenue: 0 };
    existing.quantity += item.quantity;
    existing.revenue += decimalToNumber(item.totalPrice);
    productMap.set(key, existing);
  }
  for (const item of todayWorkOrderItems) {
    const key = item.product?.name || "Producto";
    const existing = productMap.get(key) || { quantity: 0, revenue: 0 };
    existing.quantity += item.quantity;
    existing.revenue += decimalToNumber(item.subtotal);
    productMap.set(key, existing);
  }
  const topProducts = Array.from(productMap.entries())
    .map(([name, data]) => ({
      name,
      quantity: data.quantity,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Deudores summary
  const debtorsAgg = await prisma.customer.aggregate({
    where: { balance: { gt: 0 } },
    _sum: { balance: true },
    _count: { id: true },
  });
  const topDebtors = await prisma.customer.findMany({
    where: { balance: { gt: 0 } },
    select: { name: true, balance: true },
    orderBy: { balance: "desc" },
    take: 3,
  });

  // Cash register status
  const lastCashMovement = await prisma.cash_movement.findFirst({
    where: { type: { in: ["OPENING", "CLOSING"] } },
    orderBy: { createdAt: "desc" },
  });
  const isCashOpen = lastCashMovement?.type === "OPENING";
  let cashBalance = 0;
  if (isCashOpen && lastCashMovement) {
    const movementsSinceOpening = await prisma.cash_movement.findMany({
      where: { createdAt: { gte: lastCashMovement.createdAt } },
    });
    cashBalance = movementsSinceOpening.reduce((sum, m) => {
      const amount = decimalToNumber(m.amount);
      if (m.type === "OPENING" || m.type === "INCOME") return sum + amount;
      if (m.type === "EXPENSE" || m.type === "PURCHASE_VOUCHER")
        return sum - amount;
      return sum;
    }, 0);
  }

  const todayCashMovements = await prisma.cash_movement.findMany({
    where: {
      createdAt: { gte: today },
      type: { in: ["INCOME", "EXPENSE"] },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const paymentMethods = await prisma.payment_method.findMany({
    select: {
      code: true,
      name: true,
    },
  });

  const allCashMovements = await prisma.cash_movement.findMany({
    where: {
      createdAt: { gte: today },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  // Calcular métricas de ventas desde aggregates (más eficiente)
  const todayWorkOrderTotal = decimalToNumber(todaySalesAgg._sum.total) || 0;
  const todayWorkOrderCount = todaySalesAgg._count.id;
  const todayDirectTotal = decimalToNumber(todayDirectSalesAgg._sum.total) || 0;
  const todayDirectCount = todayDirectSalesAgg._count.id;

  const todayTotal = todayWorkOrderTotal + todayDirectTotal;
  const todayCount = todayWorkOrderCount + todayDirectCount;
  const ticketAverage = todayCount > 0 ? todayTotal / todayCount : 0;

  // Ventas de ayer para comparación (incluye OTs + ventas directas)
  const yesterdayWorkOrderTotal =
    decimalToNumber(yesterdaySalesAgg._sum.total) || 0;
  const yesterdayDirectTotal =
    decimalToNumber(yesterdayDirectSalesAgg._sum.total) || 0;
  const yesterdayTotal = yesterdayWorkOrderTotal + yesterdayDirectTotal;
  const vsYesterday =
    yesterdayTotal > 0
      ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100
      : 0;

  // Calcular conteos por status desde groupBy
  const statusCounts = new Map<string, number>(
    activeWorkOrdersAgg.map((g: { status: string; _count: { id: number } }) => [
      g.status,
      g._count.id,
    ]),
  );
  const byStatus = {
    pending:
      (statusCounts.get("CONFIRMED") || 0) + (statusCounts.get("WAITING") || 0),
    inProgress: statusCounts.get("IN_PROGRESS") || 0,
    ready: statusCounts.get("READY") || 0,
  };

  // Contar OTs creadas hoy (necesita query adicional optimizada)
  const newToday = await prisma.work_order.count({
    where: { createdAt: { gte: today } },
  });

  const readyForDelivery = readyWorkOrders.map((wo: any) => {
    const totalPaid = wo.payments.reduce(
      (sum: number, p: any) => sum + decimalToNumber(p.amount),
      0,
    );
    return {
      workOrderId: wo.id,
      vehicle: {
        type: wo.vehicle.category as
          | "COMPACT"
          | "SEDAN"
          | "SUV"
          | "PICKUP"
          | "TRUCK",
        description: wo.vehicle.description || `${wo.vehicle.category}`,
        identifier: wo.vehicle.identifier,
      },
      customer: {
        name: wo.customer.name,
        phone: wo.customer.phone || "",
      },
      total: decimalToNumber(wo.total),
      totalPaid,
      completedAt: wo.completedAt?.toISOString() || wo.createdAt.toISOString(),
      invoiceStatus: wo.invoiceId ? ("ISSUED" as const) : ("PENDING" as const),
    };
  });

  const methodCodeToName = paymentMethods.reduce(
    (acc, pm) => {
      acc[pm.code] = pm.name;
      return acc;
    },
    {} as Record<string, string>,
  );

  // Agrupar por método
  const paymentsByMethodGrouped = todayCashMovements.reduce(
    (
      acc: Record<string, { name: string; total: number }>,
      movement: { method: string; type: string; amount: unknown },
    ) => {
      const method = movement.method;
      const amount = decimalToNumber(movement.amount);

      if (!acc[method]) {
        acc[method] = {
          name: methodCodeToName[method] || method,
          total: 0,
        };
      }

      if (movement.type === "EXPENSE") {
        acc[method].total -= amount;
      } else {
        acc[method].total += amount;
      }

      return acc;
    },
    {} as Record<string, { name: string; total: number }>,
  );

  const paymentsByMethodArray = Object.entries(paymentsByMethodGrouped)
    .filter(([, data]) => data.total !== 0)
    .map(([code, data]: [string, { name: string; total: number }]) => ({
      code,
      name: data.name,
      total: data.total,
    }))
    .sort((a, b) => b.total - a.total);

  const cashMovementsFormatted = allCashMovements.map((m: any) => ({
    id: m.id,
    type: m.type as "INCOME" | "EXPENSE" | "OPENING" | "CLOSING",
    amount: decimalToNumber(m.amount),
    method: m.method,
    methodName: methodCodeToName[m.method] || m.method,
    referenceId: m.referenceId ?? undefined,
    referenceType: m.referenceType ?? undefined,
    reason: m.reason ?? undefined,
    createdAt: m.createdAt.toISOString(),
    createdBy: m.createdBy,
  }));

  // Calcular total activo desde el groupBy
  const activeTotal = activeWorkOrdersAgg.reduce(
    (sum, g) => sum + g._count.id,
    0,
  );

  return {
    sales: {
      today: {
        total: todayTotal,
        workOrderCount: todayCount,
        vsYesterday: Math.round(vsYesterday * 100) / 100,
      },
      ticketAverage: Math.round(ticketAverage),
    },
    workOrders: {
      active: {
        total: activeTotal,
        byStatus,
        newToday,
        oldestPending: oldestPendingWorkOrders.map((wo) => ({
          workOrderId: wo.id,
          vehicleIdentifier: wo.vehicle?.identifier || "N/A",
          customerName: wo.customer?.name || "Sin cliente",
          createdAt: wo.createdAt.toISOString(),
        })),
      },
    },
    stock: {
      lowStockCount: lowStockProducts.length,
      lowStockItems: lowStockProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        minStock: p.minStock,
      })),
    },
    readyForDelivery,
    topProducts,
    debtors: {
      totalDebt: decimalToNumber(debtorsAgg._sum.balance) || 0,
      count: debtorsAgg._count.id,
      topDebtors: topDebtors.map((d) => ({
        name: d.name,
        balance: decimalToNumber(d.balance),
      })),
    },
    cashStatus: {
      isOpen: isCashOpen,
      openedAt: lastCashMovement?.createdAt?.toISOString() || null,
      balance: cashBalance,
    },
    paymentsByMethod: paymentsByMethodArray,
    cashMovements: cashMovementsFormatted,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Obtiene todas las operaciones detalladas de un día específico
 */
export async function getDailyOperations(
  date: Date,
): Promise<DailyOperationsData> {
  const startOfDay = getArgentinaStartOfDay(date);
  const endOfDay = getArgentinaEndOfDay(date);

  const [movements, paymentMethods] = await Promise.all([
    prisma.cash_movement.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.payment_method.findMany({
      select: { code: true, name: true },
    }),
  ]);

  const methodMap = Object.fromEntries(
    paymentMethods.map((m) => [m.code, m.name]),
  );
  methodMap["PURCHASE"] = "Compra";

  // Enriquecer movimientos con información de cliente y referencias
  const enrichedMovements = await Promise.all(
    movements.map(async (m) => {
      let customer = undefined;
      let relatedId = undefined;
      let relatedType: "work_order" | "direct_sale" | undefined = undefined;

      try {
        if (m.referenceType === "work_order_payment" && m.referenceId) {
          const payment = await prisma.payment.findUnique({
            where: { id: m.referenceId },
            include: {
              workOrder: {
                include: { customer: { select: { id: true, name: true } } },
              },
            },
          });
          if (payment?.workOrder) {
            customer = payment.workOrder.customer;
            relatedId = payment.workOrder.id;
            relatedType = "work_order";
          }
        } else if (m.referenceType === "direct_sale_payment" && m.referenceId) {
          const dsPayment = await prisma.direct_sale_payment.findUnique({
            where: { id: m.referenceId },
            include: {
              directSale: {
                include: { customer: { select: { id: true, name: true } } },
              },
            },
          });
          if (dsPayment?.directSale) {
            if (dsPayment.directSale.customer) {
              customer = dsPayment.directSale.customer;
            } else {
              customer = { id: "", name: dsPayment.directSale.customerName };
            }
            relatedId = dsPayment.directSale.id;
            relatedType = "direct_sale";
          }
        } else if (m.referenceType === "customer_payment" && m.referenceId) {
          const cust = await prisma.customer.findUnique({
            where: { id: m.referenceId },
            select: { id: true, name: true },
          });
          if (cust) {
            customer = cust;
          }
        }
      } catch (err) {
        console.error(`Error enriching movement ${m.id}:`, err);
      }

      return {
        id: m.id,
        type: m.type as DailyOperationsData["movements"][0]["type"],
        amount: decimalToNumber(m.amount),
        method: m.method,
        methodName: methodMap[m.method] || m.method,
        referenceId: m.referenceId ?? undefined,
        referenceType: m.referenceType ?? undefined,
        reason: m.reason ?? undefined,
        notes: m.notes ?? undefined,
        createdAt: m.createdAt.toISOString(),
        createdBy: m.createdBy,
        customer,
        relatedId,
        relatedType,
      };
    }),
  );

  // Calcular resumen
  const summary = enrichedMovements.reduce(
    (acc, m) => {
      const amount = m.amount;
      if (m.type === "INCOME") {
        acc.totalIncome += amount;
        acc.netAmount += amount;
      } else if (m.type === "EXPENSE" || m.type === "PURCHASE_VOUCHER") {
        acc.totalExpense += amount;
        acc.netAmount -= amount;
      }

      if (
        m.type === "INCOME" ||
        m.type === "EXPENSE" ||
        m.type === "PURCHASE_VOUCHER"
      ) {
        const existingMethod = acc.byMethod.find(
          (bm) => bm.method === m.method,
        );
        const signedAmount = m.type === "INCOME" ? amount : -amount;
        if (existingMethod) {
          existingMethod.amount += signedAmount;
        } else {
          acc.byMethod.push({
            method: m.method,
            methodName: m.methodName,
            amount: signedAmount,
          });
        }
      }

      return acc;
    },
    {
      totalIncome: 0,
      totalExpense: 0,
      netAmount: 0,
      byMethod: [] as DailyOperationsData["summary"]["byMethod"],
    },
  );

  return {
    summary,
    movements: enrichedMovements,
  };
}
