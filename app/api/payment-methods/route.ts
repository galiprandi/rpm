import { NextRequest, NextResponse } from "next/server";
import { withStaff, withAdmin } from "@/lib/api-middleware";
import { db } from "@/lib/db";
import { paymentMethod } from "@/db/schema";
import { desc, asc } from "drizzle-orm";
import { toISODate } from "@/lib/utils/date";

// GET /api/payment-methods - List all payment methods
export const GET = withStaff(async () => {
  try {
    const paymentMethods = await db.query.paymentMethod.findMany({
      orderBy: [desc(paymentMethod.isActive), asc(paymentMethod.sortOrder), asc(paymentMethod.name)],
    });

    const formatted = paymentMethods.map((pm) => ({
      ...pm,
      createdAt: toISODate(pm.createdAt),
      updatedAt: toISODate(pm.updatedAt),
    }));

    return NextResponse.json({ paymentMethods: formatted });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
});

// POST /api/payment-methods - Create new payment method (ADMIN only)
export const POST = withAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, code, description, sortOrder } = body;

    // Validation
    if (!name || !code) {
      return NextResponse.json(
        { error: "Name and code are required" },
        { status: 400 }
      );
    }

    // Validate code format (uppercase snake_case)
    if (!/^[A-Z][A-Z0-9_]*$/.test(code)) {
      return NextResponse.json(
        { error: "Code must be uppercase snake_case (e.g., CREDIT_CARD)" },
        { status: 400 }
      );
    }

    const [paymentMethodRecord] = await db
      .insert(paymentMethod)
      .values({
        name,
        code,
        description,
        sortOrder: sortOrder ?? 0,
        isActive: true,
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({
      paymentMethod: {
        ...paymentMethodRecord,
        createdAt: toISODate(paymentMethodRecord.createdAt),
        updatedAt: toISODate(paymentMethodRecord.updatedAt),
      },
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating payment method:", error);
    
    // Handle unique constraint violations
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      const detail = (error as { detail?: string }).detail;
      const field = detail?.match(/Key \((\w+)\)=/)?.[1];
      return NextResponse.json(
        { error: `${field} already exists` },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create payment method" },
      { status: 500 }
    );
  }
});
