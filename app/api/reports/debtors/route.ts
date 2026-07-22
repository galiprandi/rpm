export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/auth/roles";
import { getBalanceBreakdown } from "@/lib/services/balanceService";

// Helper para convertir Decimal a number
function decimalToNumber(decimal: unknown): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === "number") return decimal;
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

    let orderBy: Record<string, string> = {};
    switch (sortBy) {
      case "amount":
        orderBy = { balance: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      default:
        orderBy = { balance: "desc" };
    }

    // Get customers with outstanding balance
    const debtors = await prisma.customer.findMany({
      where: {
        balance: {
          gt: 0,
        },
      },
      orderBy,
      take: limit,
      include: {
        work_order: {
          where: {
            status: {
              notIn: ["CANCELLED", "PAID"],
            },
          },
          select: {
            id: true,
            createdAt: true,
            total: true,
            status: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        direct_sales: {
          select: {
            id: true,
            createdAt: true,
            total: true,
            payments: { select: { amount: true } },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        vehicle: {
          select: {
            identifier: true,
          },
          take: 1,
        },
      },
    });

    // Calculate oldest debt date and total work orders for each debtor
    const formattedDebtors = await Promise.all(
      debtors.map(async (customer) => {
        const balance = decimalToNumber(customer.balance);

        // Get full breakdown from balanceService
        const breakdown = await getBalanceBreakdown(customer.id);

        const workOrderCount = customer.work_order.length;
        const directSaleCount = customer.direct_sales.length;

        // Find oldest pending work order or direct sale
        let oldestDebtDate: string | null = null;
        const allDates: Date[] = [
          ...customer.work_order.map((wo) => wo.createdAt),
          ...customer.direct_sales.map((ds) => ds.createdAt),
        ];
        if (allDates.length > 0) {
          oldestDebtDate = new Date(
            Math.min(...allDates.map((d) => d.getTime())),
          ).toISOString();
        }

        // Calculate total from pending work orders
        const pendingWorkOrdersTotal = customer.work_order.reduce(
          (sum: number, wo: { total: unknown }) =>
            sum + decimalToNumber(wo.total),
          0,
        );

        return {
          customerId: customer.id,
          customerName: customer.name,
          phone: customer.phone,
          phoneAlt: customer.phoneAlt,
          email: customer.email,
          balance,
          workOrderDebt: breakdown.workOrderDebt,
          directSaleDebt: breakdown.directSaleDebt,
          creditNoteCredit: breakdown.creditNoteCredit,
          workOrderCount,
          directSaleCount,
          oldestDebtDate,
          pendingWorkOrdersTotal,
          vehicles: customer.vehicle.map(
            (v: { identifier: string }) => v.identifier,
          ),
          recentWorkOrders: customer.work_order
            .slice(0, 3)
            .map(
              (wo: {
                id: string;
                createdAt: Date;
                total: unknown;
                status: string;
              }) => ({
                id: wo.id,
                createdAt: wo.createdAt.toISOString(),
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
