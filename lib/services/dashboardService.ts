import { prisma } from '@/lib/prisma';

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
  }>;
  generatedAt: string;
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
  // Obtener fecha de hoy y ayer en zona horaria local
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Ejecutar queries en paralelo para reducir latencia
  const [
    todayWorkOrders,
    todayDirectSales,
    yesterdayWorkOrders,
    yesterdayDirectSales,
    activeWorkOrders,
    lowStockProducts,
    readyWorkOrders,
    recentMovements,
    todayCashMovements,
    paymentMethods,
    allCashMovements
  ] = await Promise.all([
    // 1. Ventas del día - Work Orders
    prisma.work_order.findMany({
      where: {
        status: { in: ['DELIVERED', 'READY'] },
        completedAt: { gte: today },
      },
      select: {
        total: true,
        completedAt: true,
      },
    }),
    // 2. Ventas del día - Direct Sales
    prisma.direct_sale.findMany({
      where: {
        createdAt: { gte: today },
      },
      select: {
        total: true,
        createdAt: true,
      },
    }),
    // 3. Ventas de ayer - Work Orders
    prisma.work_order.findMany({
      where: {
        status: { in: ['DELIVERED', 'READY'] },
        completedAt: { gte: yesterday, lt: today },
      },
      select: { total: true },
    }),
    // 4. Ventas de ayer - Direct Sales
    prisma.direct_sale.findMany({
      where: {
        createdAt: { gte: yesterday, lt: today },
      },
      select: { total: true },
    }),
    // 5. OTs Activas
    prisma.work_order.findMany({
      where: {
        status: { in: ['CONFIRMED', 'WAITING', 'IN_PROGRESS', 'CONTROL_QC', 'READY'] },
      },
      select: { status: true, createdAt: true },
    }),
    // 6. Stock crítico
    prisma.product.findMany({
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
    }),
    // 7. Listos para entrega
    prisma.work_order.findMany({
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
    }),
    // 8. Movimientos recientes
    prisma.stock_movement.findMany({
      include: {
        product: {
          select: { name: true },
        },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
    // 9. Movimientos de caja del día (para arqueo)
    prisma.cash_movement.findMany({
      where: {
        createdAt: { gte: today },
        type: { in: ['INCOME', 'EXPENSE'] },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    // 10. Payment methods (para mapeo de nombres)
    prisma.payment_method.findMany({
      select: {
        code: true,
        name: true,
      },
    }),
    // 11. Todos los movimientos de caja del día (lista detallada)
    prisma.cash_movement.findMany({
      where: {
        createdAt: { gte: today },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    }),
  ]);

  // Calcular métricas de ventas
  const todayTotal = todayWorkOrders.reduce((sum, wo) => sum + decimalToNumber(wo.total), 0) +
                     todayDirectSales.reduce((sum, ds) => sum + decimalToNumber(ds.total), 0);
  const todayCount = todayWorkOrders.length + todayDirectSales.length;
  const ticketAverage = todayCount > 0 ? todayTotal / todayCount : 0;

  // Ventas de ayer para comparación
  const yesterdayTotal = yesterdayWorkOrders.reduce((sum, wo) => sum + decimalToNumber(wo.total), 0) +
                         yesterdayDirectSales.reduce((sum, ds) => sum + decimalToNumber(ds.total), 0);
  const vsYesterday = yesterdayTotal > 0 
    ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 
    : 0;

  const byStatus = {
    pending: activeWorkOrders.filter((wo: { status: string }) => wo.status === 'CONFIRMED' || wo.status === 'WAITING').length,
    inProgress: activeWorkOrders.filter((wo: { status: string }) => wo.status === 'IN_PROGRESS').length,
    ready: activeWorkOrders.filter((wo: { status: string }) => wo.status === 'READY').length,
  };

  const newToday = activeWorkOrders.filter((wo: { createdAt: Date }) => wo.createdAt >= today).length;

  const readyForDelivery = readyWorkOrders.map(wo => ({
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

  const recentMovementsFormatted = recentMovements.map(m => ({
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
    .map(([code, data]) => ({
      code,
      name: data.name,
      total: data.total,
    }))
    .sort((a, b) => b.total - a.total);

  const cashMovementsFormatted = allCashMovements.map(m => ({
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
        total: activeWorkOrders.length,
        byStatus,
        newToday,
      },
    },
    stock: {
      lowStockCount: lowStockProducts.length,
      lowStockItems: lowStockProducts.map(p => ({
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
