import { prisma } from '@/lib/prisma';
import { getArgentinaStartOfDay, getArgentinaStartOfYesterday } from '@/lib/utils/date';

// Helper para enmascarar teléfono
function maskPhone(phone: string | null): string {
  if (!phone) return 'No disponible';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1-XXXX-$2');
}

// Helper para formatear Decimal a number
function decimalToNumber(decimal: unknown): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === 'number') return decimal;
  // Prisma Decimal type
  if (typeof decimal === 'object' && 'toNumber' in decimal && typeof decimal.toNumber === 'function') {
    return (decimal as { toNumber: () => number }).toNumber();
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
      type: 'COMPACT' | 'SEDAN' | 'SUV' | 'PICKUP' | 'TRUCK';
      description: string;
    };
    customer: {
      name: string;
      phone: string;
    };
    total: number;
    completedAt: string;
    invoiceStatus: 'ISSUED' | 'PENDING';
  }>;
  recentMovements: Array<{
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    productName: string;
    quantity: number;
    reason: string;
    timestamp: string;
    userName: string;
  }>;
  paymentsByMethod?: Array<{
    code: string;
    name: string;
    total: number;
  }>;
  cashMovements?: Array<{
    id: string;
    type: 'INCOME' | 'EXPENSE' | 'OPENING' | 'CLOSING';
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
    type: 'INCOME' | 'EXPENSE' | 'OPENING' | 'CLOSING' | 'ADJUSTMENT';
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
    relatedType?: 'work_order' | 'direct_sale';
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
    todayDirectSalesAgg
  ] = await Promise.all([
    // 1. Ventas del día (aggregate)
    prisma.work_order.aggregate({
      where: {
        status: { in: ['DELIVERED', 'READY'] },
        completedAt: { gte: today },
      },
      _sum: { total: true },
      _count: { id: true },
    }),
    // 2. Ventas de ayer (aggregate)
    prisma.work_order.aggregate({
      where: {
        status: { in: ['DELIVERED', 'READY'] },
        completedAt: { gte: yesterday, lt: today },
      },
      _sum: { total: true },
    }),
    // 3. OTs Activas - solo conteos por status
    prisma.work_order.groupBy({
      by: ['status'],
      where: {
        status: { in: ['CONFIRMED', 'WAITING', 'IN_PROGRESS', 'CONTROL_QC', 'READY'] },
      },
      _count: { id: true },
    }),
    // 4. Ventas directas del día (aggregate)
    prisma.direct_sale.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { total: true },
      _count: { id: true },
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
    orderBy: { stock: 'asc' },
  });

  const readyWorkOrders = await prisma.work_order.findMany({
    where: {
      status: 'READY',
    },
    include: {
      customer: {
        select: { name: true, phone: true },
      },
      vehicle: {
        select: { category: true, description: true },
      },
    },
    take: 5,
    orderBy: { completedAt: 'desc' },
  });

  const recentMovements = await prisma.stock_movement.findMany({
    include: {
      product: {
        select: { name: true },
      },
    },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  const todayCashMovements = await prisma.cash_movement.findMany({
    where: {
      createdAt: { gte: today },
      type: { in: ['INCOME', 'EXPENSE'] },
    },
    orderBy: {
      createdAt: 'desc',
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
      createdAt: 'desc',
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

  // Ventas de ayer para comparación
  const yesterdayWorkOrderTotal = decimalToNumber(yesterdaySalesAgg._sum.total) || 0;
  const yesterdayTotal = yesterdayWorkOrderTotal; // Direct sales ayer no crítico para comparación
  const vsYesterday = yesterdayTotal > 0
    ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100
    : 0;

  // Calcular conteos por status desde groupBy
  const statusCounts = new Map<string, number>(
    activeWorkOrdersAgg.map((g: { status: string; _count: { id: number } }) => [g.status, g._count.id])
  );
  const byStatus = {
    pending: (statusCounts.get('CONFIRMED') || 0) + (statusCounts.get('WAITING') || 0),
    inProgress: statusCounts.get('IN_PROGRESS') || 0,
    ready: statusCounts.get('READY') || 0,
  };

  // Contar OTs creadas hoy (necesita query adicional optimizada)
  const newToday = await prisma.work_order.count({
    where: { createdAt: { gte: today } },
  });

  const readyForDelivery = readyWorkOrders.map((wo: any) => ({
    workOrderId: wo.id,
    vehicle: {
      type: wo.vehicle.category as 'COMPACT' | 'SEDAN' | 'SUV' | 'PICKUP' | 'TRUCK',
      description: wo.vehicle.description || `${wo.vehicle.category}`,
    },
    customer: {
      name: wo.customer.name,
      phone: maskPhone(wo.customer.phone),
    },
    total: decimalToNumber(wo.total),
    completedAt: wo.completedAt?.toISOString() || wo.createdAt.toISOString(),
    invoiceStatus: wo.invoiceId ? 'ISSUED' as const : 'PENDING' as const,
  }));

  const recentMovementsFormatted = recentMovements.map((m: any) => ({
    type: m.type as 'IN' | 'OUT' | 'ADJUSTMENT',
    productName: m.product.name,
    quantity: Math.abs(m.quantity),
    reason: m.reason,
    timestamp: m.createdAt.toISOString(),
    userName: m.userName || 'Sistema',
  }));

  const methodCodeToName = paymentMethods.reduce((acc, pm) => {
    acc[pm.code] = pm.name;
    return acc;
  }, {} as Record<string, string>);

  // Agrupar por método
  const paymentsByMethodGrouped = todayCashMovements.reduce((acc: Record<string, { name: string; total: number }>, movement: { method: string; type: string; amount: unknown }) => {
    const method = movement.method;
    const amount = decimalToNumber(movement.amount);

    if (!acc[method]) {
      acc[method] = {
        name: methodCodeToName[method] || method,
        total: 0,
      };
    }

    if (movement.type === 'EXPENSE') {
      acc[method].total -= amount;
    } else {
      acc[method].total += amount;
    }

    return acc;
  }, {} as Record<string, { name: string; total: number }>);

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
    type: m.type as 'INCOME' | 'EXPENSE' | 'OPENING' | 'CLOSING',
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
  const activeTotal = activeWorkOrdersAgg.reduce((sum, g) => sum + g._count.id, 0);

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
    recentMovements: recentMovementsFormatted,
    paymentsByMethod: paymentsByMethodArray,
    cashMovements: cashMovementsFormatted,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Obtiene todas las operaciones detalladas de un día específico
 */
export async function getDailyOperations(date: Date): Promise<DailyOperationsData> {
  const startOfDay = getArgentinaStartOfDay(date);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  const [movements, paymentMethods] = await Promise.all([
    prisma.cash_movement.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.payment_method.findMany({
      select: { code: true, name: true },
    }),
  ]);

  const methodMap = Object.fromEntries(paymentMethods.map(m => [m.code, m.name]));

  // Enriquecer movimientos con información de cliente y referencias
  const enrichedMovements = await Promise.all(
    movements.map(async (m) => {
      let customer = undefined;
      let relatedId = undefined;
      let relatedType: 'work_order' | 'direct_sale' | undefined = undefined;

      try {
        if (m.referenceType === 'work_order_payment' && m.referenceId) {
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
            relatedType = 'work_order';
          }
        } else if (m.referenceType === 'direct_sale_payment' && m.referenceId) {
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
              customer = { id: '', name: dsPayment.directSale.customerName };
            }
            relatedId = dsPayment.directSale.id;
            relatedType = 'direct_sale';
          }
        } else if (m.referenceType === 'customer_payment' && m.referenceId) {
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
    })
  );

  // Calcular resumen
  const summary = enrichedMovements.reduce(
    (acc, m) => {
      const amount = m.amount;
      if (m.type === 'INCOME') {
        acc.totalIncome += amount;
        acc.netAmount += amount;
      } else if (m.type === 'EXPENSE') {
        acc.totalExpense += amount;
        acc.netAmount -= amount;
      }

      if (m.type === 'INCOME' || m.type === 'EXPENSE') {
        const existingMethod = acc.byMethod.find((bm) => bm.method === m.method);
        const signedAmount = m.type === 'INCOME' ? amount : -amount;
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
      byMethod: [] as DailyOperationsData['summary']['byMethod'],
    }
  );

  return {
    summary,
    movements: enrichedMovements,
  };
}
