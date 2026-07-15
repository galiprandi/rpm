import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAuth } from "@/lib/api-middleware";
import { getInvoiceById, markInvoiceAsOfficial, updateInvoiceStatus, type InvoiceType } from "@/lib/services/invoiceService";
import { requestCAE, mapInternalToAFIPType } from "@/lib/services/afipService";
import { getSetting } from "@/lib/services/settingsService";

export const dynamic = 'force-dynamic';

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
    let officialType: InvoiceType;
    if (invoice.type === 'X_A') officialType = 'FACTURA_A';
    else if (invoice.type === 'X_B') officialType = 'FACTURA_B';
    else if (invoice.type === 'X_C') officialType = 'FACTURA_C';
    else if (invoice.type === 'NOTA_CREDITO_X_A') officialType = 'NOTA_CREDITO_A';
    else if (invoice.type === 'NOTA_CREDITO_X_B') officialType = 'NOTA_CREDITO_B';
    else {
        return NextResponse.json({ error: "Mapeo de tipo oficial no definido" }, { status: 400 });
    }

    const afipType = mapInternalToAFIPType(invoice.type);

    const response = await requestCAE({
      tipo: afipType,
      puntoVenta: Number(puntoVenta),
      customerDoc: invoice.customerDoc || '',
      customerDocType: invoice.customerDocType as 'CUIT' | 'DNI' | 'SIN_DOC' || 'SIN_DOC',
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
      type: officialType,
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

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Error in officialize invoice:", error);
    return NextResponse.json(
      { error: "Error interno al oficializar el comprobante" },
      { status: 500 },
    );
  }
}
