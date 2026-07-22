import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cashMovement, user as userTable } from "@/db/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { UserRole } from "@/lib/auth/roles";
import { invalidateCashStatus } from "@/lib/cache";
import { getSessionWithAuth } from "@/lib/api-middleware";

// POST /api/cash/open - Open cash register
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionWithAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has required role (STAFF or ADMIN)
    const userRole =
      ((session.user as { role?: string }).role as UserRole) || UserRole.USER;
    const roleHierarchy = {
      [UserRole.USER]: 0,
      [UserRole.STAFF]: 1,
      [UserRole.ADMIN]: 2,
    };

    if (roleHierarchy[userRole] < roleHierarchy[UserRole.STAFF]) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { amount, responsibleId } = body;

    // Validate amount
    if (typeof amount !== "number" || amount < 0) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a non-negative number" },
        { status: 400 },
      );
    }

    // Validate responsibleId if provided
    let finalResponsibleId = responsibleId;
    if (responsibleId && responsibleId !== session.user.id) {
      // Verify the responsible user exists and has STAFF/ADMIN role
      const responsibleUser = await db
        .select({ role: userTable.role, name: userTable.name })
        .from(userTable)
        .where(eq(userTable.id, responsibleId))
        .limit(1);

      if (!responsibleUser.length) {
        return NextResponse.json(
          { error: "Responsible user not found" },
          { status: 400 },
        );
      }

      const responsibleRole =
        (responsibleUser[0].role as UserRole) || UserRole.USER;
      if (roleHierarchy[responsibleRole] < roleHierarchy[UserRole.STAFF]) {
        return NextResponse.json(
          { error: "Responsible user must be STAFF or ADMIN" },
          { status: 400 },
        );
      }
    } else {
      // Default to current user if not provided or same as current
      finalResponsibleId = session.user.id;
    }

    // Check if ANY cash register is currently open (global validation)
    const lastOpening = await db.query.cashMovement.findFirst({
      where: eq(cashMovement.type, "OPENING"),
      orderBy: desc(cashMovement.createdAt),
    });

    if (lastOpening) {
      const lastClosing = await db.query.cashMovement.findFirst({
        where: and(
          eq(cashMovement.type, "CLOSING"),
          gte(cashMovement.createdAt, lastOpening.createdAt),
        ),
        orderBy: desc(cashMovement.createdAt),
      });

      if (!lastClosing) {
        return NextResponse.json(
          {
            error:
              "Cash register is already open (opened on " +
              new Date(lastOpening.createdAt).toISOString().split("T")[0] +
              ")",
          },
          { status: 400 },
        );
      }
    }

    // Create opening movement
    const [opening] = await db
      .insert(cashMovement)
      .values({
        type: "OPENING",
        amount: amount.toString(),
        method: "CASH",
        referenceType: "manual",
        reason: "Apertura de caja",
        createdBy: session.user.id,
        responsibleId: finalResponsibleId,
      })
      .returning();

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
      { status: 201 },
    );
  } catch (error) {
    console.error("Error opening cash register:", error);
    return NextResponse.json(
      { error: "Failed to open cash register" },
      { status: 500 },
    );
  }
}
