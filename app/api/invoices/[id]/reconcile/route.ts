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
} from "@/lib/services/afipService";
import { getSetting } from "@/lib/services/settingsService";
import {
  logAfipInteraction,
  getNextAttemptNumber,
} from "@/lib/services/afipLogService";

export const dynamic = "force-dynamic";

/**
 * POST /api/invoices/[id]/reconcile
 *
 * Reconciles a PENDING invoice by querying AFIP (FECompConsultar) to check
 * whether the voucher was actually issued. This handles the case where the
 * officialize request was interrupted (e.g. Vercel timeout) after AFIP
 * accepted the voucher but before we could persist the result.
 *
 * - If AFIP has the voucher → hydrate CAE + mark as ISSUED
 * - If AFIP does not have it → revert to DRAFT (safe to retry)
 */
export async function POST(
  _request: NextRequest,
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

    if (invoice.status !== "PENDING") {
      return NextResponse.json(
        {
          error:
            "Solo se pueden reconciliar comprobantes en estado PENDING",
        },
        { status: 400 },
      );
    }

    // Determine the AFIP type and proposed number to consult
    const afipType = mapInternalToAFIPType(invoice.type);
    const puntoVenta = await getSetting("AFIP_PUNTO_VENTA");
    const pvNum = Number(puntoVenta);

    // Extract the proposed official number from the invoice.
    // For pre-invoices, we don't have an official number yet, so we
    // query the next expected number via getLastAuthorizedNumber + 1.
    const afipService = await getAfipService();
    const lastAuthorized = await afipService.getLastAuthorizedNumber(
      afipType,
      pvNum,
    );
    const proposedNumber = lastAuthorized + 1;

    const attempt = await getNextAttemptNumber(id);
    await logAfipInteraction({
      invoiceId: id,
      attempt,
      direction: "request",
      method: "FECompConsultar",
      payload: { tipo: afipType, pv: pvNum, numero: proposedNumber },
    });

    let response;
    try {
      response = await afipService.consultVoucher(
        afipType,
        pvNum,
        proposedNumber,
      );
    } catch (callError) {
      const errorMessage =
        callError instanceof Error ? callError.message : "Error desconocido";
      await logAfipInteraction({
        invoiceId: id,
        attempt,
        direction: "response",
        method: "FECompConsultar",
        resultCode: "R",
        errorCode: "CALL_EXCEPTION",
        errorMessage,
      });
      return NextResponse.json(
        { error: `Error al consultar AFIP: ${errorMessage}` },
        { status: 502 },
      );
    }

    await logAfipInteraction({
      invoiceId: id,
      attempt,
      direction: "response",
      method: "FECompConsultar",
      response: {
        cae: response.cae,
        numeroOficial: response.numeroOficial,
        resultado: response.resultado,
        error: response.error,
      },
      resultCode: response.resultado,
      errorMessage: response.error,
    });

    if (response.success && response.resultado === "A") {
      // AFIP has the voucher — hydrate and mark as ISSUED
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
          reconciled: true,
          reconciledAt: new Date().toISOString(),
          attempt,
        },
      });

      return NextResponse.json({
        reconciled: true,
        status: "ISSUED",
        invoice: updatedInvoice,
      });
    }

    // AFIP does not have the voucher — safe to revert to DRAFT
    await updateInvoiceStatus(id, "DRAFT");
    return NextResponse.json({
      reconciled: true,
      status: "DRAFT",
      message:
        "AFIP no tiene registro de este comprobante. Revertido a DRAFT para reintentar.",
    });
  } catch (error) {
    console.error("Error reconciling invoice:", error);
    return NextResponse.json(
      { error: "Error interno al reconciliar el comprobante" },
      { status: 500 },
    );
  }
}
