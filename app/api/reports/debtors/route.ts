import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/lib/auth/roles';

// Helper para convertir Decimal a number
function decimalToNumber(decimal: unknown): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === 'number') return decimal;
  if (typeof decimal === 'object' && 'toNumber' in decimal && typeof (decimal as { toNumber: () => number }).toNumber === 'function') {
    return (decimal as { toNumber: () => number }).toNumber();
  }
  return 0;
}

// GET /api/reports/debtors - Get list of customers with outstanding balance
export async function GET(request: NextRequest) {
  try {
    await requireRole(UserRole.STAFF);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'amount'; // 'amount', 'oldest', 'newest'
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Build orderBy based on sort parameter
     
    let orderBy: Record<string, string> = {};
    switch (sortBy) {
      case 'amount':
        orderBy = { balance: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { balance: 'desc' };
    }

    // Get customers with outstanding balance
    const debtors = await prisma.customer.findMany({
      where: {
        balance: {
          gt: 0,
        },
      },
      orderBy,
      take: limit,
      include: {
        work_order: {
          where: {
            status: {
              notIn: ['CANCELLED', 'PAID'],
            },
          },
          select: {
            id: true,
            createdAt: true,
            total: true,
            status: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        vehicle: {
          select: {
            identifier: true,
          },
          take: 1,
        },
      },
    });

    // Calculate oldest debt date and total work orders for each debtor
    const formattedDebtors = debtors.map((customer) => {
      const balance = decimalToNumber(customer.balance);
      const workOrderCount = customer.work_order.length;
      
      // Find oldest pending work order
      let oldestDebtDate: string | null = null;
      if (customer.work_order.length > 0) {
        const oldest = customer.work_order[0]; // Already ordered by createdAt asc
        oldestDebtDate = oldest.createdAt.toISOString();
      }

      // Calculate total from pending work orders
      const pendingWorkOrdersTotal = customer.work_order.reduce(
        (sum: number, wo: { total: unknown }) => sum + decimalToNumber(wo.total),
        0
      );

      return {
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone,
        email: customer.email,
        balance,
        workOrderCount,
        oldestDebtDate,
        pendingWorkOrdersTotal,
        vehicles: customer.vehicle.map((v: { identifier: string }) => v.identifier),
        recentWorkOrders: customer.work_order.slice(0, 3).map((wo: { id: string; createdAt: Date; total: unknown; status: string }) => ({
          id: wo.id,
          createdAt: wo.createdAt.toISOString(),
          total: decimalToNumber(wo.total),
          status: wo.status,
        })),
      };
    });

    // Calculate summary statistics
    const totalDebt = formattedDebtors.reduce((sum, d) => sum + d.balance, 0);
    const totalCustomers = formattedDebtors.length;
    const totalWorkOrders = formattedDebtors.reduce((sum, d) => sum + d.workOrderCount, 0);

    return NextResponse.json({
      debtors: formattedDebtors,
      summary: {
        totalDebt,
        totalCustomers,
        totalWorkOrders,
        averageDebt: totalCustomers > 0 ? totalDebt / totalCustomers : 0,
      },
      sortBy,
      limit,
    });
  } catch (error) {
    console.error('Error fetching debtors report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debtors report' },
      { status: 500 }
    );
  }
}
