import { db } from "@/lib/db";
import {
  workOrder,
  directSale,
  directSaleItem,
  workOrderItem,
  customer,
  cashMovement,
  paymentMethod,
  payment,
  directSalePayment,
  product,
} from "@/db/schema";
import { eq, and, inArray, gte, lt, lte, isNotNull, sql, desc, asc, count, sum } from "drizzle-orm";
import {
  getArgentinaStartOfDay,
  getArgentinaEndOfDay,
  getArgentinaStartOfYesterday,
} from "@/lib/utils/date";

// Helper para formatear numeric (string from Drizzle) a number
function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    return Number(value) || 0;
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
  // Drizzle timestamp columns use mode: 'string', so we pass ISO strings
  const today = getArgentinaStartOfDay().toISOString();
  const yesterday = getArgentinaStartOfYesterday().toISOString();

  const saleStatuses = ["DELIVERED", "READY", "PAID"];
  const activeStatuses = ["CONFIRMED", "WAITING", "IN_PROGRESS", "CONTROL_QC", "READY"];

  // Optimized: Use aggregate queries instead of findMany + reduce
  const [
    todaySalesAgg,
    yesterdaySalesAgg,
    activeWorkOrdersAgg,
    todayDirectSalesAgg,
    yesterdayDirectSalesAgg,
  ] = await Promise.all([
    // 1. Ventas del día (aggregate)
    db.select({
      totalSum: sum(workOrder.total),
      idCount: count(workOrder.id),
    }).from(workOrder).where(and(
      inArray(workOrder.status, saleStatuses),
      gte(workOrder.completedAt, today),
    )),
    // 2. Ventas de ayer (aggregate)
    db.select({
      totalSum: sum(workOrder.total),
    }).from(workOrder).where(and(
      inArray(workOrder.status, saleStatuses),
      gte(workOrder.completedAt, yesterday),
      lt(workOrder.completedAt, today),
    )),
    // 3. OTs Activas - solo conteos por status (groupBy)
    db.select({
      status: workOrder.status,
      count: count(workOrder.id),
    }).from(workOrder).where(
      inArray(workOrder.status, activeStatuses),
    ).groupBy(workOrder.status),
    // 4. Ventas directas del día (aggregate)
    db.select({
      totalSum: sum(directSale.total),
      idCount: count(directSale.id),
    }).from(directSale).where(gte(directSale.createdAt, today)),
    // 5. Ventas directas de ayer (aggregate)
    db.select({
      totalSum: sum(directSale.total),
    }).from(directSale).where(and(
      gte(directSale.createdAt, yesterday),
      lt(directSale.createdAt, today),
    )),
  ]);

  // Ejecutar queries restantes secuencialmente para reducir carga de conexiones
  const lowStockProducts = await db.select({
    id: product.id,
    name: product.name,
    stock: product.stock,
    minStock: product.minStock,
  }).from(product).where(and(
    eq(product.isActive, true),
    sql`${product.stock} <= ${product.minStock}`,
  )).orderBy(asc(product.stock)).limit(5);

  const readyWorkOrders = await db.query.workOrder.findMany({
    where: eq(workOrder.status, "READY"),
    with: {
      customer: {
        columns: { name: true, phone: true },
      },
      vehicle: {
        columns: { category: true, description: true, identifier: true },
      },
      payments: {
        columns: { amount: true },
      },
    },
    orderBy: desc(workOrder.completedAt),
    limit: 5,
  });

  // Oldest pending work orders (CONFIRMED / WAITING) for prioritization
  const oldestPendingWorkOrders = await db.query.workOrder.findMany({
    where: inArray(workOrder.status, ["CONFIRMED", "WAITING"]),
    with: {
      customer: { columns: { name: true } },
      vehicle: { columns: { identifier: true } },
    },
    orderBy: asc(workOrder.createdAt),
    limit: 2,
  });

  // Top products sold today (from direct_sale_item + work_order_item)
  const [todayDirectSaleItems, todayWorkOrderItems] = await Promise.all([
    db.select({
      name: directSaleItem.name,
      quantity: directSaleItem.quantity,
      totalPrice: directSaleItem.totalPrice,
      productId: directSaleItem.productId,
    }).from(directSaleItem).innerJoin(
      directSale,
      eq(directSaleItem.directSaleId, directSale.id),
    ).where(and(
      gte(directSale.createdAt, today),
      isNotNull(directSaleItem.productId),
    )),
    db.select({
      quantity: workOrderItem.quantity,
      subtotal: workOrderItem.subtotal,
      productName: product.name,
    }).from(workOrderItem).innerJoin(
      workOrder,
      eq(workOrderItem.workOrderId, workOrder.id),
    ).leftJoin(
      product,
      eq(workOrderItem.productId, product.id),
    ).where(and(
      gte(workOrder.completedAt, today),
      inArray(workOrder.status, saleStatuses),
      isNotNull(workOrderItem.productId),
    )),
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
    const key = item.productName || "Producto";
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
  const debtorsAgg = await db.select({
    balanceSum: sum(customer.balance),
    idCount: count(customer.id),
  }).from(customer).where(sql`${customer.balance} > 0`);

  const topDebtors = await db.select({
    name: customer.name,
    balance: customer.balance,
  }).from(customer).where(sql`${customer.balance} > 0`)
    .orderBy(desc(customer.balance)).limit(3);

  // Cash register status
  const lastCashMovement = await db.query.cashMovement.findFirst({
    where: inArray(cashMovement.type, ["OPENING", "CLOSING"]),
    orderBy: desc(cashMovement.createdAt),
  });
  const isCashOpen = lastCashMovement?.type === "OPENING";
  let cashBalance = 0;
  if (isCashOpen && lastCashMovement) {
    const movementsSinceOpening = await db.query.cashMovement.findMany({
      where: gte(cashMovement.createdAt, lastCashMovement.createdAt),
    });
    cashBalance = movementsSinceOpening.reduce((sumVal, m) => {
      const amount = decimalToNumber(m.amount);
      if (m.type === "OPENING" || m.type === "INCOME") return sumVal + amount;
      if (m.type === "EXPENSE" || m.type === "PURCHASE_VOUCHER")
        return sumVal - amount;
      return sumVal;
    }, 0);
  }

  const todayCashMovements = await db.query.cashMovement.findMany({
    where: and(
      gte(cashMovement.createdAt, today),
      inArray(cashMovement.type, ["INCOME", "EXPENSE"]),
    ),
    orderBy: desc(cashMovement.createdAt),
  });

  const paymentMethods = await db.select({
    code: paymentMethod.code,
    name: paymentMethod.name,
  }).from(paymentMethod);

  const allCashMovements = await db.query.cashMovement.findMany({
    where: gte(cashMovement.createdAt, today),
    orderBy: desc(cashMovement.createdAt),
    limit: 20,
  });

  // Calcular métricas de ventas desde aggregates (más eficiente)
  const todayWorkOrderTotal = decimalToNumber(todaySalesAgg[0]?.totalSum) || 0;
  const todayWorkOrderCount = todaySalesAgg[0]?.idCount ?? 0;
  const todayDirectTotal = decimalToNumber(todayDirectSalesAgg[0]?.totalSum) || 0;
  const todayDirectCount = todayDirectSalesAgg[0]?.idCount ?? 0;

  const todayTotal = todayWorkOrderTotal + todayDirectTotal;
  const todayCount = todayWorkOrderCount + todayDirectCount;
  const ticketAverage = todayCount > 0 ? todayTotal / todayCount : 0;

  // Ventas de ayer para comparación (incluye OTs + ventas directas)
  const yesterdayWorkOrderTotal =
    decimalToNumber(yesterdaySalesAgg[0]?.totalSum) || 0;
  const yesterdayDirectTotal =
    decimalToNumber(yesterdayDirectSalesAgg[0]?.totalSum) || 0;
  const yesterdayTotal = yesterdayWorkOrderTotal + yesterdayDirectTotal;
  const vsYesterday =
    yesterdayTotal > 0
      ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100
      : 0;

  // Calcular conteos por status desde groupBy
  const statusCounts = new Map<string, number>(
    activeWorkOrdersAgg.map((g) => [g.status, Number(g.count)]),
  );
  const byStatus = {
    pending:
      (statusCounts.get("CONFIRMED") || 0) + (statusCounts.get("WAITING") || 0),
    inProgress: statusCounts.get("IN_PROGRESS") || 0,
    ready: statusCounts.get("READY") || 0,
  };

  // Contar OTs creadas hoy (necesita query adicional optimizada)
  const newTodayResult = await db.select({ count: count(workOrder.id) })
    .from(workOrder).where(gte(workOrder.createdAt, today));
  const newToday = Number(newTodayResult[0]?.count ?? 0);

  const readyForDelivery = readyWorkOrders.map((wo) => {
    const totalPaid = wo.payments.reduce(
      (sumVal, p) => sumVal + decimalToNumber(p.amount),
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
      completedAt: wo.completedAt ? new Date(wo.completedAt).toISOString() : new Date(wo.createdAt).toISOString(),
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

  const cashMovementsFormatted = allCashMovements.map((m) => ({
    id: m.id,
    type: m.type as "INCOME" | "EXPENSE" | "OPENING" | "CLOSING",
    amount: decimalToNumber(m.amount),
    method: m.method,
    methodName: methodCodeToName[m.method] || m.method,
    referenceId: m.referenceId ?? undefined,
    referenceType: m.referenceType ?? undefined,
    reason: m.reason ?? undefined,
    createdAt: new Date(m.createdAt).toISOString(),
    createdBy: m.createdBy,
  }));

  // Calcular total activo desde el groupBy
  const activeTotal = activeWorkOrdersAgg.reduce(
    (sumVal, g) => sumVal + Number(g.count),
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
          createdAt: new Date(wo.createdAt).toISOString(),
        })),
      },
    },
    stock: {
      lowStockCount: lowStockProducts.length,
      lowStockItems: lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        minStock: p.minStock,
      })),
    },
    readyForDelivery,
    topProducts,
    debtors: {
      totalDebt: decimalToNumber(debtorsAgg[0]?.balanceSum) || 0,
      count: Number(debtorsAgg[0]?.idCount ?? 0),
      topDebtors: topDebtors.map((d) => ({
        name: d.name,
        balance: decimalToNumber(d.balance),
      })),
    },
    cashStatus: {
      isOpen: isCashOpen,
      openedAt: lastCashMovement?.createdAt ? new Date(lastCashMovement.createdAt).toISOString() : null,
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
  const startOfDay = getArgentinaStartOfDay(date).toISOString();
  const endOfDay = getArgentinaEndOfDay(date).toISOString();

  const [movements, paymentMethods] = await Promise.all([
    db.query.cashMovement.findMany({
      where: and(
        gte(cashMovement.createdAt, startOfDay),
        lte(cashMovement.createdAt, endOfDay),
      ),
      orderBy: desc(cashMovement.createdAt),
    }),
    db.select({
      code: paymentMethod.code,
      name: paymentMethod.name,
    }).from(paymentMethod),
  ]);

  const methodMap = Object.fromEntries(
    paymentMethods.map((m) => [m.code, m.name]),
  );
  methodMap["PURCHASE"] = "Compra";

  // Enriquecer movimientos con información de cliente y referencias
  const enrichedMovements = await Promise.all(
    movements.map(async (m) => {
      let customerRec = undefined;
      let relatedId = undefined;
      let relatedType: "work_order" | "direct_sale" | undefined = undefined;

      try {
        if (m.referenceType === "work_order_payment" && m.referenceId) {
          const payRec = await db.query.payment.findFirst({
            where: eq(payment.id, m.referenceId),
            with: {
              workOrder: {
                with: { customer: { columns: { id: true, name: true } } },
              },
            },
          });
          if (payRec?.workOrder) {
            customerRec = payRec.workOrder.customer;
            relatedId = payRec.workOrder.id;
            relatedType = "work_order";
          }
        } else if (m.referenceType === "direct_sale_payment" && m.referenceId) {
          const dsPayment = await db.query.directSalePayment.findFirst({
            where: eq(directSalePayment.id, m.referenceId),
            with: {
              directSale: {
                with: { customer: { columns: { id: true, name: true } } },
              },
            },
          });
          if (dsPayment?.directSale) {
            if (dsPayment.directSale.customer) {
              customerRec = dsPayment.directSale.customer;
            } else {
              customerRec = { id: "", name: dsPayment.directSale.customerName };
            }
            relatedId = dsPayment.directSale.id;
            relatedType = "direct_sale";
          }
        } else if (m.referenceType === "customer_payment" && m.referenceId) {
          const cust = await db.query.customer.findFirst({
            where: eq(customer.id, m.referenceId),
            columns: { id: true, name: true },
          });
          if (cust) {
            customerRec = cust;
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
        createdAt: new Date(m.createdAt).toISOString(),
        createdBy: m.createdBy,
        customer: customerRec,
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
