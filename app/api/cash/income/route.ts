import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/auth/roles";
import { invalidateCashStatus } from "@/lib/cache";
import { isCashRegisterOpen } from "@/lib/services/cashMovementService";
import { getSessionWithAuth } from "@/lib/api-middleware";

// POST /api/cash/income - Register a manual cash income (capital injection, refunds, etc.)
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
    const { amount, method, reason, notes } = body;

    // Validate required fields
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a positive number" },
        { status: 400 },
      );
    }

    if (!method || typeof method !== "string") {
      return NextResponse.json(
        { error: "Method is required" },
        { status: 400 },
      );
    }

    if (!reason || typeof reason !== "string") {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 },
      );
    }

    // Check if cash register is open
    const isOpen = await isCashRegisterOpen();

    if (!isOpen) {
      return NextResponse.json(
        { error: "Cash register is not open. Please open it first." },
        { status: 400 },
      );
    }

    // Create income movement
    const income = await prisma.cash_movement.create({
      data: {
        type: "INCOME",
        amount,
        method,
        referenceType: "manual",
        reason,
        notes,
        createdBy: session.user.id,
      },
    });

    // Invalidate cash status cache so next request gets fresh data
    invalidateCashStatus();

    return NextResponse.json(
      {
        success: true,
        income: {
          id: income.id,
          amount: income.amount,
          method: income.method,
          reason: income.reason,
          createdAt: income.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating income:", error);
    return NextResponse.json(
      { error: "Failed to create income" },
      { status: 500 },
    );
  }
}
