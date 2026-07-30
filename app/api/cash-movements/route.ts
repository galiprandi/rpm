import { NextRequest, NextResponse } from "next/server";
import { withStaff, withPermission } from "@/lib/api-middleware";
import { db } from "@/lib/db";
import { cashMovement } from "@/db/schema";
import { eq, gte, lte, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { invalidateCashStatus } from "@/lib/cache";
import { toISODate } from "@/lib/utils/date";

// GET /api/cash-movements - List cash movements
export const GET = withStaff(async (request: NextRequest) => {
  try {
    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const method = searchParams.get("method");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [];

    if (startDate || endDate) {
      if (startDate) conditions.push(gte(cashMovement.createdAt, new Date(startDate).toISOString()));
      if (endDate) conditions.push(lte(cashMovement.createdAt, new Date(endDate).toISOString()));
    }

    if (type) conditions.push(eq(cashMovement.type, type));
    if (method) conditions.push(eq(cashMovement.method, method));

    const movements = await db.query.cashMovement.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: desc(cashMovement.createdAt),
    });

    return NextResponse.json({
      movements: movements.map((m) => ({
        ...m,
        amount: Number(m.amount),
        createdAt: toISODate(m.createdAt),
      })),
    });
  } catch (error) {
    console.error("Error fetching cash movements:", error);
    return NextResponse.json(
      { error: "Failed to fetch cash movements" },
      { status: 500 },
    );
  }
});

// POST /api/cash-movements - Create manual cash movement (requiere can_manage_cash)
export const POST = withPermission('can_manage_cash', async (request: NextRequest, session) => {
  try {
    const body = await request.json();
    const { type, amount, method, reason, notes } = body;

    if (!type || !amount || !method) {
      return NextResponse.json(
        { error: "Type, amount, and method are required" },
        { status: 400 },
      );
    }

    const [movement] = await db
      .insert(cashMovement)
      .values({
        type,
        amount: amount.toString(),
        method,
        referenceType: "manual",
        reason,
        notes,
        createdBy: session.user.id,
      })
      .returning();

    // Invalidate dashboard cache to show fresh data
    revalidatePath("/adm");
    invalidateCashStatus();

    return NextResponse.json({
      movement: {
        ...movement,
        amount: Number(movement.amount),
        createdAt: toISODate(movement.createdAt),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating cash movement:", error);
    return NextResponse.json(
      { error: "Failed to create cash movement" },
      { status: 500 },
    );
  }
});
