import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAuth } from "@/lib/api-middleware";
import { getInvoices, createInvoice } from "@/lib/services/invoiceService";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionWithAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const filters = {
      type: searchParams.get("type") || undefined,
      status: searchParams.get("status") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      referenceId: searchParams.get("referenceId") || undefined,
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined,
      endDate: searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : undefined,
    };

    const invoices = await getInvoices(filters);
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error in GET /api/invoices:", error);
    return NextResponse.json(
      { error: "Error al obtener los comprobantes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionWithAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Note: createInvoice already handles internal numbering
    const body = await request.json();
    const invoice = await createInvoice({
      ...body,
      createdBy: session.user.id,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/invoices:", error);
    return NextResponse.json(
      { error: "Error al crear el comprobante" },
      { status: 500 },
    );
  }
}
