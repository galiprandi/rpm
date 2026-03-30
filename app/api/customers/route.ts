import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/customers - List customers with optional search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { documentNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const customers = await prisma.customer.findMany({
      where,
      include: {
        vehicles: {
          select: {
            id: true,
            identifier: true,
            category: true,
          },
        },
        _count: {
          select: {
            workOrders: true,
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
}

// POST /api/customers - Create customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, phone, phoneAlt, email, documentType, documentNumber, address, notes } = body;

    // Validate required fields
    if (!fullName || !phone || !documentType || !documentNumber) {
      return NextResponse.json(
        { error: "Missing required fields: fullName, phone, documentType, documentNumber" },
        { status: 400 }
      );
    }

    // Validate document type
    const validDocTypes = ["DNI", "CUIT", "CUIL"];
    if (!validDocTypes.includes(documentType)) {
      return NextResponse.json(
        { error: "Invalid documentType. Must be DNI, CUIT, or CUIL" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        fullName,
        phone,
        phoneAlt,
        email,
        documentType,
        documentNumber,
        address,
        notes,
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
}
