import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/lib/auth/roles';
import { invalidateCashStatus } from '@/lib/cache';

// Helper para convertir Decimal a number
function decimalToNumber(decimal: unknown): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === 'number') return decimal;
  if (typeof decimal === 'object' && 'toNumber' in decimal && typeof decimal.toNumber === 'function') {
    return (decimal as { toNumber: () => number }).toNumber();
  }
  return 0;
}

// POST /api/cash/close - Close cash register
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has required role (STAFF or ADMIN)
    const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;
    const roleHierarchy = {
      [UserRole.USER]: 0,
      [UserRole.STAFF]: 1,
      [UserRole.ADMIN]: 2,
    };

    if (roleHierarchy[userRole] < roleHierarchy[UserRole.STAFF]) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { counts, differenceReason } = body;

    // Validate counts object
    if (!counts || typeof counts !== 'object') {
      return NextResponse.json(
        { error: 'Counts object is required with amounts per payment method' },
        { status: 400 }
      );
    }

    // Check if cash register is open
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOpening = await prisma.cash_movement.findFirst({
      where: {
        type: 'OPENING',
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!todayOpening) {
      return NextResponse.json(
        { error: 'Cash register is not open. Please open it first.' },
        { status: 400 }
      );
    }

    // Check if already closed
    const todayClosing = await prisma.cash_movement.findFirst({
      where: {
        type: 'CLOSING',
        createdAt: {
          gte: todayOpening.createdAt,
          lt: tomorrow,
        },
      },
    });

    if (todayClosing) {
      return NextResponse.json(
        { error: 'Cash register is already closed for today' },
        { status: 400 }
      );
    }

    // Get all movements since opening to calculate expected amounts
    const movements = await prisma.cash_movement.findMany({
      where: {
        createdAt: {
          gte: todayOpening.createdAt,
          lt: tomorrow,
        },
      },
    });

    // Calculate expected amounts per method
    const expectedByMethod: Record<string, number> = {};
    movements.forEach(movement => {
      const method = movement.method;
      const amount = decimalToNumber(movement.amount);
      
      if (!expectedByMethod[method]) {
        expectedByMethod[method] = 0;
      }

      switch (movement.type) {
        case 'OPENING':
        case 'INCOME':
          expectedByMethod[method] += amount;
          break;
        case 'EXPENSE':
          expectedByMethod[method] -= amount;
          break;
      }
    });

    // Calculate differences per method
    const differences: Record<string, number> = {};
    let hasDifference = false;

    Object.keys(counts).forEach(method => {
      const counted = Number(counts[method]) || 0;
      const expected = expectedByMethod[method] || 0;
      const difference = counted - expected;
      
      differences[method] = difference;
      if (Math.abs(difference) > 0.01) {
        hasDifference = true;
      }
    });

    // Require reason if there's any difference
    if (hasDifference && (!differenceReason || differenceReason.trim().length < 5)) {
      return NextResponse.json(
        { 
          error: 'Difference reason is required when there are discrepancies',
          differences,
          expected: expectedByMethod,
          counted: counts
        },
        { status: 400 }
      );
    }

    // Create closing movement for CASH
    const cashCounted = Number(counts.CASH) || Number(counts.EFECTIVO) || 0;
    const closing = await prisma.cash_movement.create({
      data: {
        type: 'CLOSING',
        amount: cashCounted,
        method: 'CASH',
        referenceType: 'manual',
        reason: 'Cierre de caja',
        notes: hasDifference ? `Diferencias: ${JSON.stringify(differences)}. Motivo: ${differenceReason}` : undefined,
        createdBy: session.user.id,
      },
    });

    // Create adjustment movements for any differences
    if (hasDifference) {
      for (const [method, diff] of Object.entries(differences)) {
        if (Math.abs(diff) > 0.01) {
          await prisma.cash_movement.create({
            data: {
              type: 'ADJUSTMENT',
              amount: Math.abs(diff),
              method,
              referenceType: 'manual',
              reason: diff > 0 ? 'Sobrante en arqueo' : 'Faltante en arqueo',
              notes: differenceReason,
              createdBy: session.user.id,
            },
          });
        }
      }
    }

    // Invalidate cash status cache so next request gets fresh data
    invalidateCashStatus();

    return NextResponse.json(
      {
        success: true,
        closing: {
          id: closing.id,
          amount: closing.amount,
          method: closing.method,
          createdAt: closing.createdAt,
        },
        differences,
        expected: expectedByMethod,
        counted: counts,
        hasDifference,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error closing cash register:', error);
    return NextResponse.json(
      { error: 'Failed to close cash register' },
      { status: 500 }
    );
  }
}
