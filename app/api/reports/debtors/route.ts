export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { customer, workOrder, directSale } from "@/db/schema";
import { gt, notInArray, asc, desc } from "drizzle-orm";
import { UserRole } from "@/lib/auth/roles";
import { getBalanceBreakdown } from "@/lib/services/balanceService";

// Helper para convertir Decimal a number
function decimalToNumber(decimal: unknown): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === "number") return decimal;
  if (typeof decimal === "string") return Number(decimal);
  if (
    typeof decimal === "object" &&
    "toNumber" in decimal &&
    typeof (decimal as { toNumber: () => number }).toNumber === "function"
  ) {
    return (decimal as { toNumber: () => number }).toNumber();
  }
  return 0;
}

// GET /api/reports/debtors - Get list of customers with outstanding balance
export async function GET(request: NextRequest) {
  try {
    await requireRole(UserRole.STAFF);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "amount"; // 'amount', 'oldest', 'newest'
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Build orderBy based on sort parameter
    let orderBy;
    switch (sortBy) {
      case "amount":
        orderBy = desc(customer.balance);
        break;
      case "oldest":
        orderBy = asc(customer.createdAt);
        break;
      case "newest":
        orderBy = desc(customer.createdAt);
        break;
      default:
        orderBy = desc(customer.balance);
    }

    // Get customers with outstanding balance
    const debtors = await db.query.customer.findMany({
      where: gt(customer.balance, '0'),
      orderBy,
      limit,
      with: {
        workOrders: {
          where: notInArray(workOrder.status, ["CANCELLED", "PAID"]),
          columns: {
            id: true,
            createdAt: true,
            total: true,
            status: true,
          },
          orderBy: asc(workOrder.createdAt),
        },
        directSales: {
          columns: {
            id: true,
            createdAt: true,
            total: true,
          },
          with: {
            directSalePayments: {
              columns: { amount: true },
            },
          },
          orderBy: asc(directSale.createdAt),
        },
        vehicles: {
          columns: {
            identifier: true,
          },
          limit: 1,
        },
      },
    });

    // Calculate oldest debt date and total work orders for each debtor
    const formattedDebtors = await Promise.all(
      debtors.map(async (customerRecord) => {
        const balance = decimalToNumber(customerRecord.balance);

        // Get full breakdown from balanceService
        const breakdown = await getBalanceBreakdown(customerRecord.id);

        const workOrderCount = customerRecord.workOrders.length;
        const directSaleCount = customerRecord.directSales.length;

        // Find oldest pending work order or direct sale
        let oldestDebtDate: string | null = null;
        const allDates: string[] = [
          ...customerRecord.workOrders.map((wo) => wo.createdAt),
          ...customerRecord.directSales.map((ds) => ds.createdAt),
        ];
        if (allDates.length > 0) {
          oldestDebtDate = new Date(
            Math.min(...allDates.map((d) => new Date(d).getTime())),
          ).toISOString();
        }

        // Calculate total from pending work orders
        const pendingWorkOrdersTotal = customerRecord.workOrders.reduce(
          (sum: number, wo: { total: unknown }) =>
            sum + decimalToNumber(wo.total),
          0,
        );

        return {
          customerId: customerRecord.id,
          customerName: customerRecord.name,
          phone: customerRecord.phone,
          phoneAlt: customerRecord.phoneAlt,
          email: customerRecord.email,
          balance,
          workOrderDebt: breakdown.workOrderDebt,
          directSaleDebt: breakdown.directSaleDebt,
          creditNoteCredit: breakdown.creditNoteCredit,
          workOrderCount,
          directSaleCount,
          oldestDebtDate,
          pendingWorkOrdersTotal,
          vehicles: customerRecord.vehicles.map(
            (v: { identifier: string }) => v.identifier,
          ),
          recentWorkOrders: customerRecord.workOrders
            .slice(0, 3)
            .map(
              (wo: {
                id: string;
                createdAt: string;
                total: unknown;
                status: string;
              }) => ({
                id: wo.id,
                createdAt: new Date(wo.createdAt).toISOString(),
                total: decimalToNumber(wo.total),
                status: wo.status,
              }),
            ),
        };
      }),
    );

    // Calculate summary statistics
    const totalDebt = formattedDebtors.reduce((sum, d) => sum + d.balance, 0);
    const totalCustomers = formattedDebtors.length;
    const totalWorkOrders = formattedDebtors.reduce(
      (sum, d) => sum + d.workOrderCount,
      0,
    );
    const totalDirectSales = formattedDebtors.reduce(
      (sum, d) => sum + d.directSaleCount,
      0,
    );

    return NextResponse.json({
      debtors: formattedDebtors,
      summary: {
        totalDebt,
        totalCustomers,
        totalWorkOrders,
        totalDirectSales,
        averageDebt: totalCustomers > 0 ? totalDebt / totalCustomers : 0,
      },
      sortBy,
      limit,
    });
  } catch (error) {
    console.error("Error fetching debtors report:", error);
    return NextResponse.json(
      { error: "Failed to fetch debtors report" },
      { status: 500 },
    );
  }
}
