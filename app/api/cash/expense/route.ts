import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/lib/auth/roles';

// POST /api/cash/expense - Register a cash expense
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
    const { amount, method, reason, notes } = body;

    // Validate required fields
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number' },
        { status: 400 }
      );
    }

    if (!method || typeof method !== 'string') {
      return NextResponse.json(
        { error: 'Method is required' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        { error: 'Reason is required' },
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

    // Create expense movement
    const expense = await prisma.cash_movement.create({
      data: {
        type: 'EXPENSE',
        amount,
        method,
        referenceType: 'manual',
        reason,
        notes,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        expense: {
          id: expense.id,
          amount: expense.amount,
          method: expense.method,
          reason: expense.reason,
          createdAt: expense.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
