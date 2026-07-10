import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { capitalizeText } from "@/lib/utils/format";

// GET /api/customers - List customers with optional search (requiere ADMIN)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withAdmin(async (request: NextRequest, _session) => {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            {
              billingData: {
                path: ["cuit"],
                string_contains: search,
              },
            },
            {
              vehicle: {
                some: {
                  identifier: { contains: search, mode: "insensitive" as const },
                },
              },
            },
          ],
        }
      : {};

    const customers = await prisma.customer.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            identifier: true,
            category: true,
          },
        },
        _count: {
          select: {
            work_order: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.customer.count({ where });

    return NextResponse.json({ customers, total, limit, offset });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
});

// POST /api/customers - Create customer (requiere ADMIN)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const POST = withAdmin(async (request: NextRequest, _session) => {
  try {
    const body = await request.json();
    const { name, phone, phoneAlt, email, address, notes, billingData } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

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

    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: capitalizeText(name) || name,
        phone,
        phoneAlt,
        email,
        address,
        notes,
        billingData: billingData || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
});
