import { NextRequest, NextResponse } from "next/server";
import { withAdminDynamic } from "@/lib/api-middleware";
import { db } from "@/lib/db";
import { customer, cashMovement, workOrder, directSale, creditNote } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { capitalizeText } from "@/lib/utils/format";
import { toISODate } from "@/lib/utils/date";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/customers/[id] - Get customer by ID (requiere ADMIN)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withAdminDynamic(async (request: NextRequest, { params }: Params, _session) => {
  try {
    const { id } = await params;
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

    const payments = await db.query.cashMovement.findMany({
      where: and(
        eq(cashMovement.referenceType, "customer_payment"),
        eq(cashMovement.referenceId, id),
      ),
      orderBy: desc(cashMovement.createdAt),
      limit: 50,
    });

    if (!cust) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Helper to convert numeric string to number
    const decimalToNumber = (decimal: unknown): number => {
      if (decimal === null || decimal === undefined) return 0;
      if (typeof decimal === 'number') return decimal;
      if (typeof decimal === 'string') return Number(decimal);
      return 0;
    };

    // Transform to match frontend interface
    // Drizzle mode:'string' timestamps return raw PG format ("2026-07-21 21:32:23.162")
    // Convert to ISO 8601 for API consistency
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
        createdAt: toISODate(wo.createdAt),
        updatedAt: toISODate(wo.updatedAt),
        scheduledDate: toISODate(wo.scheduledDate),
        startedAt: toISODate(wo.startedAt),
        completedAt: toISODate(wo.completedAt),
        deliveredAt: toISODate(wo.deliveredAt),
      })),
      directSales: (cust.directSales || []).map((ds) => ({
        ...ds,
        createdAt: toISODate(ds.createdAt),
      })),
      creditNotes: (cust.creditNotes || []).map((cn) => ({
        ...cn,
        createdAt: toISODate(cn.createdAt),
      })),
      payments: (payments || []).map((p) => ({
        ...p,
        createdAt: toISODate(p.createdAt),
      })),
    };

    return NextResponse.json(transformedCustomer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
});

// PUT /api/customers/[id] - Update customer (requiere ADMIN)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const PUT = withAdminDynamic(async (request: NextRequest, { params }: Params, _session) => {
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

    return NextResponse.json({
      ...updated,
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

// DELETE /api/customers/[id] - Delete customer (requiere ADMIN)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const DELETE = withAdminDynamic(async (request: NextRequest, { params }: Params, _session) => {
  try {
    const { id } = await params;
    await db.delete(customer).where(eq(customer.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
});
