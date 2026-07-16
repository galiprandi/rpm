import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAuth } from "@/lib/api-middleware";

export const dynamic = 'force-dynamic';
import {
  getInvoiceById,
  updateInvoiceStatus,
  updateInvoiceBillingData,
} from "@/lib/services/invoiceService";
import { validateCUIT } from "@/lib/services/afipService";

// GET /api/invoices/[id] - Get invoice by ID
export async function GET(
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
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 },
    );
  }
}

// PATCH /api/invoices/[id] - Update invoice status or billing data
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionWithAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, issuedAt, customerName, customerDoc, customerDocType } = body;

    // Case 1: Status update (legacy compatibility)
    if (status !== undefined) {
      if (!["DRAFT", "ISSUED", "CANCELLED", "REJECTED"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const invoice = await updateInvoiceStatus(id, status, issuedAt);
      return NextResponse.json({ invoice });
    }

    // Case 2: Billing data update
    if (customerName !== undefined || customerDoc !== undefined || customerDocType !== undefined) {
      // Basic validations
      if (customerName !== undefined && !customerName.trim()) {
        return NextResponse.json({ error: "El nombre o razón social no puede estar vacío" }, { status: 400 });
      }

      if (customerDocType !== undefined && !['DNI', 'CUIT', 'SIN_DOC'].includes(customerDocType)) {
        return NextResponse.json({ error: "Tipo de documento no válido" }, { status: 400 });
      }

      // Check validation of CUIT if provided or existing
      const currentInvoice = await getInvoiceById(id);
      if (!currentInvoice) {
        return NextResponse.json({ error: "Comprobante no encontrado" }, { status: 404 });
      }

      const finalDocType = customerDocType !== undefined ? customerDocType : currentInvoice.customerDocType;
      const finalDoc = customerDoc !== undefined ? customerDoc : currentInvoice.customerDoc;

      if (finalDocType === 'CUIT' && finalDoc) {
        if (!validateCUIT(finalDoc)) {
          return NextResponse.json({ error: "El CUIT no tiene un formato válido (Módulo 11)" }, { status: 400 });
        }
      }

      const invoice = await updateInvoiceBillingData(id, {
        customerName,
        customerDoc,
        customerDocType,
      });

      return NextResponse.json({ invoice });
    }

    return NextResponse.json({ error: "No se proporcionaron datos para actualizar" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update invoice" },
      { status: 500 },
    );
  }
}
