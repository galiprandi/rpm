import { NextRequest, NextResponse } from "next/server";
import { withStaff, withAdmin } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

// GET /api/payment-methods - List all payment methods
export const GET = withStaff(async () => {
  try {
    const paymentMethods = await prisma.payment_method.findMany({
      orderBy: [
        { isActive: "desc" },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({ paymentMethods });
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

    const paymentMethod = await prisma.payment_method.create({
      data: {
        name,
        code,
        description,
        sortOrder: sortOrder ?? 0,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ paymentMethod }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating payment method:", error);
    
    // Handle unique constraint violations
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const meta = (error as { meta?: { target?: string[] } }).meta;
      const field = meta?.target?.[0];
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
