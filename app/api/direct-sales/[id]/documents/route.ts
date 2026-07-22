import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAuth } from "@/lib/api-middleware";
import { generateDocumentFromDirectSale } from "@/lib/services/directSaleService";
import { InvoiceType } from "@/lib/services/invoiceService";
import { toISODate } from "@/lib/utils/date";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionWithAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { type, forceNew } = body;

    const document = await generateDocumentFromDirectSale(id, session.user.id, {
      type: (type && type !== 'INVOICE') ? (type as InvoiceType) : undefined,
      forceNew: !!forceNew,
    });

    // Convert Drizzle raw PG timestamps to ISO 8601 and string decimals to numbers
    const documentSerialized = {
      ...document,
      subtotal: Number(document.subtotal),
      tax: document.tax !== null ? Number(document.tax) : null,
      total: Number(document.total),
      iva21: document.iva21 !== null ? Number(document.iva21) : null,
      iva105: document.iva105 !== null ? Number(document.iva105) : null,
      issuedAt: toISODate(document.issuedAt),
      createdAt: toISODate(document.createdAt),
    };

    return NextResponse.json(documentSerialized, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/direct-sales/[id]/documents:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al generar el documento" },
      { status: 500 }
    );
  }
}
