import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/lib/auth/roles';

// POST /api/admin/recalculate-balances - Recalculate all customer balances
export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is ADMIN
    const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;
    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden: Admin only' },
        { status: 403 }
      );
    }

    // Get all customers with their work orders
    const customers = await prisma.customer.findMany({
      include: {
        work_order: {
          where: {
            status: {
              notIn: ['CANCELLED', 'PAID'],
            },
          },
        },
      },
    });

    const results = [];

    for (const customer of customers) {
      // Calculate what the balance should be (sum of unpaid work orders)
      const calculatedBalance = customer.work_order.reduce(
        (sum: any, wo: any) => sum + Number(wo.total),
        0
      );

      const currentBalance = Number(customer.balance) || 0;

      // Update if different
      if (calculatedBalance !== currentBalance) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { balance: calculatedBalance },
        });

        results.push({
          customerId: customer.id,
          name: customer.name,
          previousBalance: currentBalance,
          newBalance: calculatedBalance,
          difference: calculatedBalance - currentBalance,
          unpaidWorkOrders: customer.work_order.length,
        });
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      customers: results,
    });
  } catch (error) {
    console.error('Error recalculating balances:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate balances' },
      { status: 500 }
    );
  }
}
