/**
 * API Route: /api/dashboard/summary
 * Métodos: GET
 * Spec: /specs/spec-admin-dashboard.md
 * 
 * Retorna un resumen del dashboard con métricas de ventas, OTs, stock y movimientos
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
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

// GET /api/dashboard/summary
export async function GET() {
  try {
    // Validar sesión y rol
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si tiene rol STAFF o ADMIN
    const userRole = session.user.role;
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener fecha de hoy y ayer en zona horaria local
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 1. Ventas del día (basado en work_orders completadas)
    const todayWorkOrders = await prisma.work_order.findMany({
      where: {
        status: { in: ['DELIVERED', 'READY'] },
        completedAt: { gte: today },
      },
      select: {
        total: true,
        completedAt: true,
      },
    });

    const todayTotal = todayWorkOrders.reduce((sum, wo) => sum + decimalToNumber(wo.total), 0);
    const todayCount = todayWorkOrders.length;
    const ticketAverage = todayCount > 0 ? todayTotal / todayCount : 0;

    // Ventas de ayer para comparación
    const yesterdayWorkOrders = await prisma.work_order.findMany({
      where: {
        status: { in: ['DELIVERED', 'READY'] },
        completedAt: { gte: yesterday, lt: today },
      },
      select: { total: true },
    });

    const yesterdayTotal = yesterdayWorkOrders.reduce((sum, wo) => sum + decimalToNumber(wo.total), 0);
    const vsYesterday = yesterdayTotal > 0 
      ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 
      : 0;

    // 2. OTs Activas
    const activeWorkOrders = await prisma.work_order.findMany({
      where: {
        status: { in: ['CONFIRMED', 'WAITING', 'IN_PROGRESS', 'CONTROL_QC', 'READY'] },
      },
      select: { status: true, createdAt: true },
    });

    const byStatus = {
      pending: activeWorkOrders.filter((wo: { status: string }) => wo.status === 'CONFIRMED' || wo.status === 'WAITING').length,
      inProgress: activeWorkOrders.filter((wo: { status: string }) => wo.status === 'IN_PROGRESS').length,
      ready: activeWorkOrders.filter((wo: { status: string }) => wo.status === 'READY').length,
    };

    const newToday = activeWorkOrders.filter((wo: { createdAt: Date }) => wo.createdAt >= today).length;

    // 3. Stock crítico
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

    // 4. Listos para entrega
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

    // 5. Movimientos recientes
    const recentMovements = await prisma.stock_movement.findMany({
      include: {
        product: {
          select: { name: true },
        },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    const recentMovementsFormatted = recentMovements.map(m => ({
      type: m.type as 'IN' | 'OUT' | 'ADJUSTMENT',
      productName: m.product.name,
      quantity: m.quantity,
      reason: m.reason,
      timestamp: m.createdAt.toISOString(),
      userName: m.userName || 'Sistema',
    }));

    // 6. Ingresos por medio de pago (del día)
    const paymentsByMethod = await prisma.payment.findMany({
      where: {
        createdAt: { gte: today },
      },
      include: {
        paymentMethod: {
          select: { name: true, code: true },
        },
      },
    });

    const paymentsByMethodGrouped = paymentsByMethod.reduce((acc, payment) => {
      const methodCode = payment.paymentMethod.code;
      const amount = decimalToNumber(payment.amount);
      
      if (!acc[methodCode]) {
        acc[methodCode] = {
          name: payment.paymentMethod.name,
          total: 0,
        };
      }
      acc[methodCode].total += amount;
      
      return acc;
    }, {} as Record<string, { name: string; total: number }>);

    const paymentsByMethodArray = Object.entries(paymentsByMethodGrouped)
      .map(([code, data]) => ({
        code,
        name: data.name,
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total);

    // Response
    const response = {
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
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en dashboard summary:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
