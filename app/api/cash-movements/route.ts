import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasRole, UserRole } from '@/lib/auth/roles';
import { prisma } from '@/lib/prisma';

// GET /api/cash-movements - List cash movements
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const method = searchParams.get('method');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (type) where.type = type;
    if (method) where.method = method;

    const movements = await prisma.cash_movement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ movements });
  } catch (error) {
    console.error("Error fetching cash movements:", error);
    return NextResponse.json(
      { error: "Failed to fetch cash movements" },
      { status: 500 }
    );
  }
}

// POST /api/cash-movements - Create manual cash movement
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = await hasRole(session.user.id, UserRole.ADMIN);
    if (!userRole) {
      return NextResponse.json(
        { error: "Only ADMIN can create manual cash movements" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, amount, method, reason, notes } = body;

    if (!type || !amount || !method) {
      return NextResponse.json(
        { error: "Type, amount, and method are required" },
        { status: 400 }
      );
    }

    const movement = await prisma.cash_movement.create({
      data: {
        type,
        amount,
        method,
        referenceType: 'manual',
        reason,
        notes,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    console.error("Error creating cash movement:", error);
    return NextResponse.json(
      { error: "Failed to create cash movement" },
      { status: 500 }
    );
  }
}
