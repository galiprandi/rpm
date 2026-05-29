import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS, CACHE_DURATIONS } from '@/lib/cache';

// Helper para convertir Decimal a number
function decimalToNumber(decimal: unknown): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === 'number') return decimal;
  if (typeof decimal === 'object' && 'toNumber' in decimal && typeof decimal.toNumber === 'function') {
    return (decimal as { toNumber: () => number }).toNumber();
  }
  return 0;
}

// Cached function to get cash status - reduces DB queries
const getCachedCashStatus = unstable_cache(
  async () => {
    // Find the absolute latest OPENING or CLOSING movement
    const lastMovement = await prisma.cash_movement.findFirst({
      where: {
        type: {
          in: ['OPENING', 'CLOSING'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const isOpen = lastMovement?.type === 'OPENING';
    const lastOpening = isOpen ? lastMovement : await prisma.cash_movement.findFirst({
      where: { type: 'OPENING' },
      orderBy: { createdAt: 'desc' },
    });

    const lastClosingAtOpening = lastOpening ? await prisma.cash_movement.findFirst({
      where: {
        type: 'CLOSING',
        createdAt: {
          gte: lastOpening.createdAt
        }
      },
      orderBy: { createdAt: 'desc' },
    }) : null;

    // Get all payment methods for the summary
    const paymentMethods = await prisma.payment_method.findMany({
      select: { code: true, name: true },
      where: { isActive: true },
    });

    // Build summary by method
    const summary: Record<string, {
      opening: number;
      income: number;
      expense: number;
      expected: number;
    }> = {};

    // Initialize with all payment methods (including CASH)
    const allMethods = ['CASH', ...paymentMethods.map((pm: any) => pm.code)];
    allMethods.forEach(method => {
      summary[method] = { opening: 0, income: 0, expense: 0, expected: 0 };
    });

    if (isOpen && lastOpening) {
      // Get all movements since opening
      const movements = await prisma.cash_movement.findMany({
        where: {
          createdAt: {
            gte: lastOpening.createdAt,
          },
        },
      });

      movements.forEach((movement: any) => {
        const method = movement.method;
        const amount = decimalToNumber(movement.amount);

        if (!summary[method]) {
          summary[method] = { opening: 0, income: 0, expense: 0, expected: 0 };
        }

        switch (movement.type) {
          case 'OPENING':
            summary[method].opening += amount;
            break;
          case 'INCOME':
            summary[method].income += amount;
            break;
          case 'EXPENSE':
          case 'PURCHASE_VOUCHER':
            summary[method].expense += amount;
            break;
        }
      });

      // Calculate expected for each method
      Object.keys(summary).forEach(method => {
        summary[method].expected = summary[method].opening
          + summary[method].income
          - summary[method].expense;
      });
    }

    // Get last closing amount for suggestion
    const lastClosing = await prisma.cash_movement.findFirst({
      where: {
        type: 'CLOSING',
        method: 'CASH',
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      status: isOpen ? 'OPEN' : 'CLOSED',
      openedAt: lastOpening?.createdAt?.toISOString() || null,
      openedBy: lastOpening?.createdBy || null,
      closedAt: lastClosingAtOpening?.createdAt?.toISOString() || null,
      summary,
      suggestedOpeningAmount: lastClosing ? decimalToNumber(lastClosing.amount) : 0,
    };
  },
  [CACHE_TAGS.CASH_STATUS],
  { revalidate: CACHE_DURATIONS.CASH_STATUS, tags: [CACHE_TAGS.CASH_STATUS] }
);

// GET /api/cash/status - Get current cash register status
// Cache for 5 minutes - invalidated on cash movements
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getCachedCashStatus();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching cash status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cash status' },
      { status: 500 }
    );
  }
}
