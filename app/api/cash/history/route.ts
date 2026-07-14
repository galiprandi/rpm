import { NextRequest, NextResponse } from 'next/server';
import { withStaff } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';

// Helper para convertir Decimal a number
function decimalToNumber(decimal: unknown): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === 'number') return decimal;
  if (typeof decimal === 'object' && 'toNumber' in decimal && typeof decimal.toNumber === 'function') {
    return (decimal as { toNumber: () => number }).toNumber();
  }
  return 0;
}

// GET /api/cash/history - Get cash register history with pagination
export const GET = withStaff(async (request: NextRequest) => {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;

    // Get all cash openings with their closings
    const openings = await prisma.cash_movement.findMany({
      where: {
        type: 'OPENING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: skip,
    });

    // Get total count for pagination
    const totalCount = await prisma.cash_movement.count({
      where: {
        type: 'OPENING',
      },
    });

    // For each opening, find the corresponding closing and calculate totals
    const history = await Promise.all(
      openings.map(async (opening: any) => {
        const openingDate = new Date(opening.createdAt);
        const nextDay = new Date(openingDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Find closing for this opening (no date restriction, just after opening)
        const closing = await prisma.cash_movement.findFirst({
          where: {
            type: 'CLOSING',
            createdAt: {
              gte: openingDate,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        // Get all movements between opening and closing (or end of day)
        const movements = await prisma.cash_movement.findMany({
          where: {
            createdAt: {
              gte: openingDate,
              lt: closing ? closing.createdAt : nextDay,
            },
          },
        });

        // Calculate totals
        let totalIncome = 0;
        let totalExpense = 0;
        let totalAdjustments = 0;
        let cashIncome = 0;
        let cashExpense = 0;

        movements.forEach((movement: any) => {
          const amount = decimalToNumber(movement.amount);
          switch (movement.type) {
            case 'INCOME':
              totalIncome += amount;
              if (movement.method === 'CASH') cashIncome += amount;
              break;
            case 'EXPENSE':
            case 'PURCHASE_VOUCHER':
              totalExpense += amount;
              if (movement.method === 'CASH') cashExpense += amount;
              break;
            case 'ADJUSTMENT':
              totalAdjustments += amount;
              break;
          }
        });

        // Calculate difference (from closing amount vs expected)
        let difference = 0;
        let differenceReason = null;

        if (closing) {
          // Only CASH movements affect the cash drawer expected amount.
          // Non-cash methods (credit card, transfer, QR) go directly to bank.
          const expectedAmount = decimalToNumber(opening.amount) + cashIncome - cashExpense;
          const closingAmount = decimalToNumber(closing.amount);
          difference = closingAmount - expectedAmount;
          
          // Extract reason from closing notes if exists
          if (closing.notes && closing.notes.includes('Motivo:')) {
            const match = closing.notes.match(/Motivo: (.+)/);
            if (match) {
              differenceReason = match[1];
            }
          }
        }

        // Get user names (executor and responsible)
        const openedByUser = await prisma.user.findUnique({
          where: { id: opening.createdBy },
          select: { name: true },
        });

        // Get responsible user (cajero de turno)
        let responsibleUser = null;
        if (opening.responsibleId) {
          responsibleUser = await prisma.user.findUnique({
            where: { id: opening.responsibleId },
            select: { name: true },
          });
        }

        let closedByUser = null;
        if (closing) {
          closedByUser = await prisma.user.findUnique({
            where: { id: closing.createdBy },
            select: { name: true },
          });
        }

        return {
          id: opening.id,
          date: opening.createdAt.toISOString().split('T')[0],
          openedAt: opening.createdAt.toISOString(),
          openedBy: openedByUser?.name || 'Unknown',
          openedById: opening.createdBy,
          responsibleBy: responsibleUser?.name || openedByUser?.name || 'Unknown',
          responsibleById: opening.responsibleId || opening.createdBy,
          closedAt: closing?.createdAt?.toISOString() || null,
          closedBy: closedByUser?.name || null,
          closedById: closing?.createdBy || null,
          openingAmount: decimalToNumber(opening.amount),
          totalIncome,
          totalExpense,
          totalAdjustments,
          closingAmount: closing ? decimalToNumber(closing.amount) : null,
          expectedAmount: decimalToNumber(opening.amount) + cashIncome - cashExpense,
          difference,
          differenceReason,
          status: closing ? (Math.abs(difference) < 0.01 ? 'BALANCED' : difference > 0 ? 'SURPLUS' : 'SHORTAGE') : 'OPEN',
          isClosed: !!closing,
        };
      })
    );

    return NextResponse.json({
      history,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + openings.length < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching cash history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cash history' },
      { status: 500 }
    );
  }
});
