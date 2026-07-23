import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAuth } from "@/lib/api-middleware";
import { getInvoices, createInvoice } from "@/lib/services/invoiceService";
import { toISODate } from "@/lib/utils/date";
import { serializeDrizzleResult } from "@/lib/utils/serialization";

/**
 * Normalizes an invoice row returned by Drizzle (mode: 'string') so that
 * API consumers receive ISO 8601 timestamps and numeric decimals instead of
 * raw PG timestamp strings and stringified numerics.
 */
function serializeInvoice<T extends Record<string, unknown>>(invoice: T) {
  return {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    tax: invoice.tax != null ? Number(invoice.tax) : invoice.tax,
    total: Number(invoice.total),
    iva21: invoice.iva21 != null ? Number(invoice.iva21) : invoice.iva21,
    iva105: invoice.iva105 != null ? Number(invoice.iva105) : invoice.iva105,
    // perceptions/exemptions are jsonb — only coerce when they hold a primitive
    perceptions:
      typeof invoice.perceptions === "string" || typeof invoice.perceptions === "number"
        ? Number(invoice.perceptions)
        : invoice.perceptions,
    exemptions:
      typeof invoice.exemptions === "string" || typeof invoice.exemptions === "number"
        ? Number(invoice.exemptions)
        : invoice.exemptions,
    createdAt: toISODate(invoice.createdAt),
    issuedAt: toISODate(invoice.issuedAt),
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionWithAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate: Date | undefined = undefined;
    if (startDateParam) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(startDateParam)) {
        startDate = new Date(`${startDateParam}T00:00:00.000Z`);
      } else {
        startDate = new Date(startDateParam);
      }
    }

    let endDate: Date | undefined = undefined;
    if (endDateParam) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(endDateParam)) {
        endDate = new Date(`${endDateParam}T23:59:59.999Z`);
      } else {
        endDate = new Date(endDateParam);
      }
    }

    const filters = {
      type: searchParams.get("type") || undefined,
      status: searchParams.get("status") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      search: searchParams.get("search") || undefined,
      startDate,
      endDate,
    };

    const invoices = await getInvoices(filters);
    return NextResponse.json(serializeDrizzleResult(invoices.map(serializeInvoice)));
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

    return NextResponse.json(serializeInvoice(invoice), { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/invoices:", error);
    return NextResponse.json(
      { error: "Error al crear el comprobante" },
      { status: 500 },
    );
  }
}
