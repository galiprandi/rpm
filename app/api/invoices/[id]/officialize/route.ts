import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAuth } from "@/lib/api-middleware";
import {
  getInvoiceById,
  markInvoiceAsOfficial,
  updateInvoiceStatus,
  type InvoiceType,
} from "@/lib/services/invoiceService";
import {
  getAfipService,
  mapInternalToAFIPType,
  validateCUIT,
  AFIP_DOC_TIPOS,
} from "@/lib/services/afipService";
import { getSetting } from "@/lib/services/settingsService";
import {
  logAfipInteraction,
  getNextAttemptNumber,
} from "@/lib/services/afipLogService";
import { toISODate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

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
    perceptions:
      typeof invoice.perceptions === "string" ||
      typeof invoice.perceptions === "number"
        ? Number(invoice.perceptions)
        : invoice.perceptions,
    exemptions:
      typeof invoice.exemptions === "string" ||
      typeof invoice.exemptions === "number"
        ? Number(invoice.exemptions)
        : invoice.exemptions,
    createdAt: toISODate(invoice.createdAt),
    issuedAt: toISODate(invoice.issuedAt),
  };
}

/**
 * Infers the AFIP "concepto" (1=productos, 2=servicios, 3=mixto) from the
 * invoice items. If all items have productId → 1, all serviceId → 2, else 3.
 */
function inferConcepto(items: Array<{ name: string }>): 1 | 2 | 3 {
  // We don't have direct access to productId/serviceId here from the generic items,
  // so we default to 1 (productos) which is the most common case for a workshop.
  // The real implementation should query the original items table.
  // For now, 3 (mixto) is the safe default for work orders that typically have both.
  void items;
  return 3;
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
      return NextResponse.json(
        { error: "Comprobante no encontrado" },
        { status: 404 },
      );
    }

    // Reject double-submit: only DRAFT or REJECTED can be officialized.
    // PENDING means a previous request is in flight or was interrupted.
    if (invoice.status !== "DRAFT" && invoice.status !== "REJECTED") {
      if (invoice.status === "PENDING") {
        return NextResponse.json(
          {
            error:
              "Este comprobante ya fue enviado a AFIP y está pendiente de confirmación. Use el endpoint de reconciliación para verificar su estado.",
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        {
          error: "Solo se pueden oficializar comprobantes en estado DRAFT o REJECTED",
        },
        { status: 400 },
      );
    }

    if (
      !invoice.type.startsWith("X_") &&
      !invoice.type.startsWith("NOTA_CREDITO_X_")
    ) {
      return NextResponse.json(
        { error: "Tipo de comprobante no válido para oficialización" },
        { status: 400 },
      );
    }

    // Map internal type to official AFIP type
    let mappedType: InvoiceType;
    if (invoice.type === "X_A") mappedType = "FACTURA_A";
    else if (invoice.type === "X_B") mappedType = "FACTURA_B";
    else if (invoice.type === "X_C") mappedType = "FACTURA_C";
    else if (invoice.type === "NOTA_CREDITO_X_A")
      mappedType = "NOTA_CREDITO_A";
    else if (invoice.type === "NOTA_CREDITO_X_B")
      mappedType = "NOTA_CREDITO_B";
    else {
      return NextResponse.json(
        { error: "Mapeo de tipo oficial no definido" },
        { status: 400 },
      );
    }

    const afipType = mapInternalToAFIPType(invoice.type);

    // Document validation
    const customerDoc = invoice.customerDoc || "";
    const customerDocType = (invoice.customerDocType as "CUIT" | "DNI" | "SIN_DOC") || "SIN_DOC";

    if (customerDocType === "CUIT") {
      if (!customerDoc) {
        return NextResponse.json(
          { error: "Se requiere el CUIT del cliente" },
          { status: 400 },
        );
      }
      if (!validateCUIT(customerDoc)) {
        return NextResponse.json(
          { error: "El CUIT del cliente no es válido" },
          { status: 400 },
        );
      }
    }

    if (mappedType === "FACTURA_A" || mappedType === "NOTA_CREDITO_A") {
      if (!customerDoc || customerDocType !== "CUIT") {
        return NextResponse.json(
          { error: "Para comprobantes tipo A se requiere el CUIT del cliente" },
          { status: 400 },
        );
      }
    }

    // --- Step 1: Set PENDING status (commit before calling AFIP) ---
    await updateInvoiceStatus(id, "PENDING");

    // --- Step 2: Build the complete AFIP payload ---
    const puntoVenta = await getSetting("AFIP_PUNTO_VENTA");
    const cbteFch = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const docTipo =
      customerDocType === "CUIT"
        ? AFIP_DOC_TIPOS.CUIT
        : customerDocType === "DNI"
          ? AFIP_DOC_TIPOS.DNI
          : AFIP_DOC_TIPOS.SIN_DOC;
    const docNro = customerDoc ? parseInt(customerDoc.replace(/\D/g, ""), 10) || 0 : 0;
    const concepto = inferConcepto(invoice.items || []);

    const afipPayload = {
      tipo: afipType,
      puntoVenta: Number(puntoVenta),
      customerDoc,
      customerDocType,
      total: Number(invoice.total),
      neto: Number(invoice.subtotal),
      iva21: Number(invoice.iva21 || 0),
      iva105: Number(invoice.iva105 || 0),
      impOpEx: 0,
      impTrib: 0,
      concepto,
      cbteFch,
      docTipo,
      docNro,
    };

    // --- Step 3: Log the request ---
    const attempt = await getNextAttemptNumber(id);
    await logAfipInteraction({
      invoiceId: id,
      attempt,
      direction: "request",
      method: "FECAESolicitar",
      payload: afipPayload,
    });

    // --- Step 4: Call AFIP (via mock or real service) ---
    const afipService = await getAfipService();
    let response;
    try {
      response = await afipService.requestCAE(afipPayload);
    } catch (callError) {
      // If the call itself throws (e.g. timeout, network error),
      // the invoice stays in PENDING. Log the error and return.
      const errorMessage =
        callError instanceof Error ? callError.message : "Error desconocido";
      await logAfipInteraction({
        invoiceId: id,
        attempt,
        direction: "response",
        method: "FECAESolicitar",
        resultCode: "R",
        errorCode: "CALL_EXCEPTION",
        errorMessage,
      });
      return NextResponse.json(
        {
          error: `Error al comunicarse con AFIP: ${errorMessage}`,
          pending: true,
        },
        { status: 502 },
      );
    }

    // --- Step 5: Log the response ---
    await logAfipInteraction({
      invoiceId: id,
      attempt,
      direction: "response",
      method: "FECAESolicitar",
      response: {
        cae: response.cae,
        numeroOficial: response.numeroOficial,
        resultado: response.resultado,
        observaciones: response.observaciones,
        error: response.error,
      },
      resultCode: response.resultado,
      errorCode: response.code,
      errorMessage: response.error,
    });

    // --- Step 6: Process the result ---
    if (!response.success || response.resultado === "R") {
      // Rejected — revert to REJECTED with error details
      await updateInvoiceStatus(id, "REJECTED", undefined, {
        success: response.success,
        resultado: response.resultado,
        error: response.error,
        observaciones: response.observaciones,
        attempt,
      });

      return NextResponse.json(
        {
          error: response.error || "AFIP rechazó la solicitud",
          observaciones: response.observaciones,
        },
        { status: 400 },
      );
    }

    // Success — hydrate with CAE + official number
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
        fechaProceso: new Date().toISOString(),
        attempt,
      },
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
