import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAuth } from "@/lib/api-middleware";
import { getInvoiceById, markInvoiceAsOfficial, updateInvoiceStatus, type InvoiceType } from "@/lib/services/invoiceService";
import { requestCAE, mapInternalToAFIPType, validateCUIT } from "@/lib/services/afipService";
import { getSetting } from "@/lib/services/settingsService";
import { toISODate } from "@/lib/utils/date";

export const dynamic = 'force-dynamic';

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionWithAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return NextResponse.json({ error: "Comprobante no encontrado" }, { status: 404 });
    }

    if (invoice.status !== 'DRAFT' && invoice.status !== 'REJECTED') {
      return NextResponse.json({ error: "Solo se pueden oficializar comprobantes en estado DRAFT o REJECTED" }, { status: 400 });
    }

    if (!invoice.type.startsWith('X_') && !invoice.type.startsWith('NOTA_CREDITO_X_')) {
       return NextResponse.json({ error: "Tipo de comprobante no válido para oficialización" }, { status: 400 });
    }

    // Prepare data for AFIP
    const puntoVenta = await getSetting('AFIP_PUNTO_VENTA');

    // Map internal type to official AFIP type
    let mappedType: InvoiceType;
    if (invoice.type === 'X_A') mappedType = 'FACTURA_A';
    else if (invoice.type === 'X_B') mappedType = 'FACTURA_B';
    else if (invoice.type === 'X_C') mappedType = 'FACTURA_C';
    else if (invoice.type === 'NOTA_CREDITO_X_A') mappedType = 'NOTA_CREDITO_A';
    else if (invoice.type === 'NOTA_CREDITO_X_B') mappedType = 'NOTA_CREDITO_B';
    else {
        return NextResponse.json({ error: "Mapeo de tipo oficial no definido" }, { status: 400 });
    }

    const afipType = mapInternalToAFIPType(invoice.type);

    // Document Validation
    const customerDoc = invoice.customerDoc || '';
    const customerDocType = (invoice.customerDocType as 'CUIT' | 'DNI' | 'SIN_DOC') || 'SIN_DOC';

    if (customerDocType === 'CUIT') {
      if (!customerDoc) {
        return NextResponse.json({ error: "Se requiere el CUIT del cliente" }, { status: 400 });
      }
      if (!validateCUIT(customerDoc)) {
        return NextResponse.json({ error: "El CUIT del cliente no es válido" }, { status: 400 });
      }
    }

    if (mappedType === 'FACTURA_A' || mappedType === 'NOTA_CREDITO_A') {
      if (!customerDoc || customerDocType !== 'CUIT') {
        return NextResponse.json({ error: "Para comprobantes tipo A se requiere el CUIT del cliente" }, { status: 400 });
      }
    }

    const response = await requestCAE({
      tipo: afipType,
      puntoVenta: Number(puntoVenta),
      customerDoc,
      customerDocType,
      total: Number(invoice.total),
      neto: Number(invoice.subtotal),
      iva21: Number(invoice.iva21 || 0),
      iva105: Number(invoice.iva105 || 0),
    });

    if (!response.success || response.resultado === 'R') {
      // Persist the rejection in the database
      await updateInvoiceStatus(id, 'REJECTED', undefined, {
        success: response.success,
        resultado: response.resultado,
        error: response.error,
        observaciones: response.observaciones
      });

      return NextResponse.json({
        error: response.error || "AFIP rechazó la solicitud",
        observaciones: response.observaciones
      }, { status: 400 });
    }

    // Success! Update invoice in DB
    const updatedInvoice = await markInvoiceAsOfficial(id, {
      number: response.numeroOficial!,
      type: mappedType,
      cae: response.cae!,
      caeVencimiento: response.caeVencimiento!,
      afipData: {
        cae: response.cae,
        caeVencimiento: response.caeVencimiento,
        numeroOficial: response.numeroOficial,
        resultado: response.resultado,
        observaciones: response.observaciones,
        fechaProceso: new Date(),
      }
    });

    return NextResponse.json(serializeInvoice(updatedInvoice));
  } catch (error) {
    console.error("Error in officialize invoice:", error);
    return NextResponse.json(
      { error: "Error interno al oficializar el comprobante" },
      { status: 500 },
    );
  }
}
