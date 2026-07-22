import { NextResponse } from "next/server";
import { getSessionWithAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/auth/roles";
import { recalculateCustomerBalance } from "@/lib/services/balanceService";

// POST /api/admin/recalculate-balances - Recalculate all customer balances
export async function POST() {
  try {
    const session = await getSessionWithAuth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is ADMIN
    const userRole =
      ((session.user as { role?: string }).role as UserRole) || UserRole.USER;
    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden: Admin only" },
        { status: 403 },
      );
    }

    // Get all customers
    const customers = await prisma.customer.findMany({
      select: { id: true, name: true, balance: true },
    });

    const results = [];
    let totalDrift = 0;

    for (const customer of customers) {
      const storedBalance = Number(customer.balance) || 0;
      const calculatedBalance = await recalculateCustomerBalance(customer.id);

      const drift = storedBalance - calculatedBalance;

      if (Math.abs(drift) > 0.01) {
        totalDrift += drift;
        results.push({
          customerId: customer.id,
          name: customer.name,
          previousBalance: storedBalance,
          newBalance: calculatedBalance,
          difference: calculatedBalance - storedBalance,
        });
      }
    }

    return NextResponse.json({
      success: true,
      customersProcessed: customers.length,
      driftsFound: results.length,
      totalDrift,
      customers: results,
    });
  } catch (error) {
    console.error("Error recalculating balances:", error);
    return NextResponse.json(
      { error: "Failed to recalculate balances" },
      { status: 500 },
    );
  }
}
