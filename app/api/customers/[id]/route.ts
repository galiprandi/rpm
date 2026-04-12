import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/customers/[id] - Get customer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        vehicle: {
          include: {
            vehicle_make: true,
            vehicle_model: true,
          },
        },
        work_order: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            vehicle: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Helper to convert Decimal to number
    const decimalToNumber = (decimal: unknown): number => {
      if (decimal === null || decimal === undefined) return 0;
      if (typeof decimal === 'number') return decimal;
      if (typeof decimal === 'object' && 'toNumber' in decimal && typeof (decimal as { toNumber: () => number }).toNumber === 'function') {
        return (decimal as { toNumber: () => number }).toNumber();
      }
      return 0;
    };

    // Transform Prisma field names to match frontend interface
    const transformedCustomer = {
      ...customer,
      balance: decimalToNumber(customer.balance),
      vehicles: customer.vehicle || [],
      workOrders: customer.work_order || [],
      vehicle: undefined,
      work_order: undefined,
    };

    return NextResponse.json(transformedCustomer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        phone,
        phoneAlt,
        email,
        address,
        notes,
        billingData: billingData || null,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
