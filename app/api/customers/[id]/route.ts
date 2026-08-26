import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { withAdminDynamic, withPermissionDynamic } from "@/lib/api-middleware";
import { db } from "@/lib/db";
import { customer, cashMovement, workOrder, directSale, creditNote } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { capitalizeText } from "@/lib/utils/format";
import { toISODate } from "@/lib/utils/date";
import { serializeDrizzleResult } from "@/lib/utils/serialization";
import {
  CACHE_DURATIONS,
  customerCacheTag,
  invalidateCustomer,
} from "@/lib/cache";

interface Params {
  params: Promise<{ id: string }>;
}

// Cached DB query for a single customer with relations.
// Uses a dynamic tag (customer-${id}) so mutations can invalidate only
// the affected customer. Fallback revalidate is 5 minutes as a safety net.
const getCustomerCached = (id: string) =>
  unstable_cache(
    async () => {
      const cust = await db.query.customer.findFirst({
        where: eq(customer.id, id),
        with: {
          vehicles: {
            with: {
              vehicleMake: true,
              vehicleModel: true,
            },
          },
          workOrders: {
            orderBy: desc(workOrder.createdAt),
            limit: 50,
            with: {
              vehicle: true,
              payments: {
                columns: { amount: true },
              },
            },
          },
          directSales: {
            orderBy: desc(directSale.createdAt),
            limit: 50,
            with: {
              directSaleItems: true,
            },
          },
          creditNotes: {
            orderBy: desc(creditNote.createdAt),
            limit: 50,
            with: {
              creditNoteItems: true,
            },
          },
        },
      });

      if (!cust) return null;

      const payments = await db.query.cashMovement.findMany({
        where: and(
          eq(cashMovement.referenceType, "customer_payment"),
          eq(cashMovement.referenceId, id),
        ),
        orderBy: desc(cashMovement.createdAt),
        limit: 50,
      });

      // Helper to convert numeric string to number
      const decimalToNumber = (decimal: unknown): number => {
        if (decimal === null || decimal === undefined) return 0;
        if (typeof decimal === 'number') return decimal;
        if (typeof decimal === 'string') return Number(decimal);
        return 0;
      };

      // Transform to match frontend interface
      const transformedCustomer = {
        ...cust,
        createdAt: toISODate(cust.createdAt),
        updatedAt: toISODate(cust.updatedAt),
        balance: decimalToNumber(cust.balance),
        vehicles: (cust.vehicles || []).map((v) => ({
          ...v,
          createdAt: toISODate(v.createdAt),
          updatedAt: toISODate(v.updatedAt),
        })),
        workOrders: (cust.workOrders || []).map((wo) => ({
          ...wo,
          total: decimalToNumber(wo.total),
          totalProducts: decimalToNumber(wo.totalProducts),
          totalServices: decimalToNumber(wo.totalServices),
          createdAt: toISODate(wo.createdAt),
          updatedAt: toISODate(wo.updatedAt),
          scheduledDate: toISODate(wo.scheduledDate),
          startedAt: toISODate(wo.startedAt),
          completedAt: toISODate(wo.completedAt),
          deliveredAt: toISODate(wo.deliveredAt),
          payments: (wo.payments || []).map((p) => ({
            amount: decimalToNumber(p.amount),
          })),
        })),
        directSales: (cust.directSales || []).map((ds) => ({
          ...ds,
          total: decimalToNumber(ds.total),
          createdAt: toISODate(ds.createdAt),
        })),
        creditNotes: (cust.creditNotes || []).map((cn) => ({
          ...cn,
          total: decimalToNumber(cn.total),
          cashAmount: cn.cashAmount ? decimalToNumber(cn.cashAmount) : null,
          accountCreditAmount: cn.accountCreditAmount ? decimalToNumber(cn.accountCreditAmount) : null,
          createdAt: toISODate(cn.createdAt),
        })),
        payments: (payments || []).map((p) => ({
          ...p,
          amount: decimalToNumber(p.amount),
          createdAt: toISODate(p.createdAt),
        })),
      };

      return serializeDrizzleResult(transformedCustomer);
    },
    [`customer-${id}`],
    {
      tags: [customerCacheTag(id)],
      revalidate: CACHE_DURATIONS.CUSTOMER,
    },
  );

// GET /api/customers/[id] - Get customer by ID (requiere ADMIN)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withAdminDynamic(async (request: NextRequest, { params }: Params, _session) => {
  try {
    const { id } = await params;
    const fetchCustomer = getCustomerCached(id);
    const transformedCustomer = await fetchCustomer();

    if (!transformedCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transformedCustomer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
});

// PUT /api/customers/[id] - Update customer (requiere can_manage_customers)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const PUT = withPermissionDynamic('can_manage_customers', async (request: NextRequest, { params }: Params, _session) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, phoneAlt, email, address, notes, billingData } = body;

    // Validate billingData if provided
    if (billingData) {
      if (!billingData.cuit || !billingData.invoiceType) {
        return NextResponse.json(
          { error: "billingData requires cuit and invoiceType" },
          { status: 400 }
        );
      }
      const validInvoiceTypes = ["A", "B", "C", "M"];
      if (!validInvoiceTypes.includes(billingData.invoiceType)) {
        return NextResponse.json(
          { error: "Invalid invoiceType. Must be A, B, C, or M" },
          { status: 400 }
        );
      }
    }

    const [updated] = await db
      .update(customer)
      .set({
        name: capitalizeText(name) || name,
        phone,
        phoneAlt,
        email,
        address,
        notes,
        billingData: billingData || null,
      })
      .where(eq(customer.id, id))
      .returning();

    // Invalidate cached customer data
    invalidateCustomer(id);

    return NextResponse.json({
      ...updated,
      balance: Number(updated.balance),
      createdAt: toISODate(updated.createdAt),
      updatedAt: toISODate(updated.updatedAt),
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
});

// DELETE /api/customers/[id] - Delete customer (requiere can_manage_customers)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const DELETE = withPermissionDynamic('can_manage_customers', async (request: NextRequest, { params }: Params, _session) => {
  try {
    const { id } = await params;
    await db.delete(customer).where(eq(customer.id, id));

    // Invalidate cached customer data
    invalidateCustomer(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
});
