import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/api-middleware";
import { db } from "@/lib/db";
import { customer } from "@/db/schema";
import { recalculateCustomerBalance } from "@/lib/services/balanceService";

// POST /api/admin/recalculate-balances - Recalculate all customer balances (requiere can_run_maintenance)
export const POST = withPermission('can_run_maintenance', async (_request: NextRequest, _session) => {
  try {
    // Get all customers
    const customers = await db
      .select({ id: customer.id, name: customer.name, balance: customer.balance })
      .from(customer);

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
});
