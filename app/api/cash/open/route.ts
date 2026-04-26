import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/lib/auth/roles';
import { invalidateCashStatus } from '@/lib/cache';

// POST /api/cash/open - Open cash register
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
    const { amount, responsibleId } = body;

    // Validate amount
    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a non-negative number' },
        { status: 400 }
      );
    }

    // Validate responsibleId if provided
    let finalResponsibleId = responsibleId;
    if (responsibleId && responsibleId !== session.user.id) {
      // Verify the responsible user exists and has STAFF/ADMIN role
      const responsibleUser = await prisma.user.findUnique({
        where: { id: responsibleId },
        select: { role: true, name: true },
      });

      if (!responsibleUser) {
        return NextResponse.json(
          { error: 'Responsible user not found' },
          { status: 400 }
        );
      }

      const responsibleRole = responsibleUser.role as UserRole || UserRole.USER;
      if (roleHierarchy[responsibleRole] < roleHierarchy[UserRole.STAFF]) {
        return NextResponse.json(
          { error: 'Responsible user must be STAFF or ADMIN' },
          { status: 400 }
        );
      }
    } else {
      // Default to current user if not provided or same as current
      finalResponsibleId = session.user.id;
    }

    // Check if ANY cash register is currently open (global validation)
    const lastOpening = await prisma.cash_movement.findFirst({
      where: { type: 'OPENING' },
      orderBy: { createdAt: 'desc' },
    });

    if (lastOpening) {
      const lastClosing = await prisma.cash_movement.findFirst({
        where: {
          type: 'CLOSING',
          createdAt: { gte: lastOpening.createdAt },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!lastClosing) {
        return NextResponse.json(
          { error: 'Cash register is already open (opened on ' + lastOpening.createdAt.toISOString().split('T')[0] + ')' },
          { status: 400 }
        );
      }
    }

    // Create opening movement
    const opening = await prisma.cash_movement.create({
      data: {
        type: 'OPENING',
        amount,
        method: 'CASH',
        referenceType: 'manual',
        reason: 'Apertura de caja',
        createdBy: session.user.id,
        responsibleId: finalResponsibleId,
      },
    });

    // Invalidate cash status cache so next request gets fresh data
    invalidateCashStatus();

    return NextResponse.json(
      {
        success: true,
        opening: {
          id: opening.id,
          amount: opening.amount,
          method: opening.method,
          createdAt: opening.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error opening cash register:', error);
    return NextResponse.json(
      { error: 'Failed to open cash register' },
      { status: 500 }
    );
  }
}
