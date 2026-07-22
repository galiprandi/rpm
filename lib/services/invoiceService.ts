import { db, type Database } from "@/lib/db";
import { invoice, workOrderItem, directSaleItem, creditNoteItem } from "@/db/schema";
import { eq, and, or, gte, lte, ilike, like, desc, type SQL } from "drizzle-orm";

type DbOrTx = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

export type InvoiceType =
  | "X_A"
  | "X_B"
  | "X_C"
  | "FACTURA_A"
  | "FACTURA_B"
  | "FACTURA_C"
  | "NOTA_CREDITO_X_A"
  | "NOTA_CREDITO_X_B"
  | "NOTA_CREDITO_A"
  | "NOTA_CREDITO_B"
  | "PRESUPUESTO"
  | "REMITO";

export type InvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "ISSUED"
  | "REJECTED"
  | "CANCELLED"
  | "ANNULLED";

export interface InvoiceInput {
  type: InvoiceType;
  referenceId: string;
  referenceType: "work_order" | "direct_sale" | "credit_note";
  customerId?: string;
  customerName: string;
  customerDoc?: string;
  customerDocType?: string;
  subtotal: number;
  tax?: number;
  iva21?: number;
  iva105?: number;
  exemptions?: unknown;
  perceptions?: unknown;
  total: number;
  afipData?: unknown;
  status: InvoiceStatus;
  issuedAt?: Date;
  createdBy: string;
}

const DEFAULT_IVA_RATE = 21;

/**
 * Creates a new invoice and automatically assigns the next number.
 * If a transaction client is provided, it uses it. Otherwise, it creates a new transaction.
 */
export async function createInvoice(
  data: InvoiceInput,
  tx?: DbOrTx,
) {
  const execute = async (transaction: DbOrTx) => {
    const number = await getNextInvoiceNumber(data.type, transaction);

    // Auto-calculate taxes if not provided
    let taxes = {
      subtotal: data.subtotal,
      tax: data.tax || 0,
      iva21: data.iva21 || 0,
      iva105: data.iva105 || 0,
    };

    if (data.tax === undefined || data.tax === null) {
      taxes = calculateInvoiceTaxes(data.total, data.type);
    }

    const [created] = await transaction
      .insert(invoice)
      .values({
        id: crypto.randomUUID(),
        number,
        type: data.type,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        customerId: data.customerId || null,
        customerName: data.customerName,
        customerDoc: data.customerDoc,
        customerDocType: data.customerDocType,
        subtotal: taxes.subtotal.toString(),
        tax: taxes.tax.toString(),
        iva21: taxes.iva21.toString(),
        iva105: taxes.iva105.toString(),
        exemptions: data.exemptions as any,
        perceptions: data.perceptions as any,
        total: data.total.toString(),
        afipData: data.afipData as any,
        status: data.status,
        issuedAt: data.issuedAt ? data.issuedAt.toISOString() : undefined,
        createdBy: data.createdBy,
      })
      .returning();

    return created;
  };

  if (tx) {
    return execute(tx);
  }

  return await db.transaction(execute);
}

export async function getInvoices(filters: {
  startDate?: Date;
  endDate?: Date;
  type?: string;
  status?: string;
  customerId?: string;
  search?: string;
}) {
  const conditions: SQL[] = [];

  if (filters.startDate || filters.endDate) {
    if (filters.startDate) conditions.push(gte(invoice.createdAt, filters.startDate.toISOString()));
    if (filters.endDate) conditions.push(lte(invoice.createdAt, filters.endDate.toISOString()));
  }

  if (filters.type) conditions.push(eq(invoice.type, filters.type));
  if (filters.status) conditions.push(eq(invoice.status, filters.status));
  if (filters.customerId) conditions.push(eq(invoice.customerId, filters.customerId));

  if (filters.search) {
    conditions.push(
      or(
        ilike(invoice.number, `%${filters.search}%`),
        ilike(invoice.customerName, `%${filters.search}%`),
        ilike(invoice.customerDoc, `%${filters.search}%`),
      )!,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db.query.invoice.findMany({
    where,
    with: {
      customer: {
        columns: { name: true, phone: true },
      },
    },
    orderBy: desc(invoice.createdAt),
  });
}

export async function getInvoiceById(id: string) {
  const foundInvoice = await db.query.invoice.findFirst({
    where: eq(invoice.id, id),
    with: {
      customer: true,
    },
  });

  if (!foundInvoice) return null;

  // Fetch line items based on reference type
  let items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }> = [];

  try {
    if (foundInvoice.referenceType === "work_order") {
      const woItems = await db.query.workOrderItem.findMany({
        where: eq(workOrderItem.workOrderId, foundInvoice.referenceId),
        with: {
          product: { columns: { name: true } },
          service: { columns: { name: true } },
        },
      });
      items = woItems.map((item) => ({
        name:
          item.name ||
          item.product?.name ||
          item.service?.name ||
          "Item sin nombre",
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.subtotal),
      }));
    } else if (foundInvoice.referenceType === "direct_sale") {
      const saleItems = await db.query.directSaleItem.findMany({
        where: eq(directSaleItem.directSaleId, foundInvoice.referenceId),
      });
      items = saleItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      }));
    } else if (foundInvoice.referenceType === "credit_note") {
      const cnItems = await db.query.creditNoteItem.findMany({
        where: eq(creditNoteItem.creditNoteId, foundInvoice.referenceId),
      });
      items = cnItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      }));
    }
  } catch (error) {
    console.error("Error fetching items for invoice:", error);
    // Continue without items if fetch fails
  }

  return {
    ...foundInvoice,
    items,
  };
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
  issuedAt?: Date,
  afipData?: unknown,
) {
  const [updated] = await db
    .update(invoice)
    .set({
      status,
      issuedAt: issuedAt ? issuedAt.toISOString() : (status === "ISSUED" ? new Date().toISOString() : undefined),
      afipData: afipData as any,
    })
    .where(eq(invoice.id, id))
    .returning();

  return updated;
}

/**
 * Updates an invoice with official AFIP data after successful authorization.
 */
export async function markInvoiceAsOfficial(
  id: string,
  data: {
    number: string;
    type: InvoiceType;
    cae: string;
    caeVencimiento: Date;
    afipData: unknown;
  },
) {
  const [updated] = await db
    .update(invoice)
    .set({
      number: data.number,
      type: data.type,
      status: "ISSUED",
      issuedAt: new Date().toISOString(),
      afipData: data.afipData as any,
    })
    .where(eq(invoice.id, id))
    .returning();

  return updated;
}

/**
 * Calculates and returns the next invoice number for a given type.
 * Uses a transaction to ensure no duplicates.
 */
export async function getNextInvoiceNumber(
  type: string,
  tx: DbOrTx = db,
): Promise<string> {
  // Determine prefix based on type
  let prefix = "0001";
  if (type.startsWith("X_") || type.startsWith("NOTA_CREDITO_X_")) {
    prefix = "X-0001";
  } else if (type === "PRESUPUESTO") {
    prefix = "PRES";
  } else if (type === "REMITO") {
    prefix = "REM";
  }

  // For pre-invoices, since the number format is "X-0001-XXXXXXXX" and the number field is globally @unique,
  // we must query by prefix rather than the specific type to avoid duplicate sequence collisions in the DB.
  const isPreInvoice = type.startsWith("X_") || type.startsWith("NOTA_CREDITO_X_");
  const where = isPreInvoice
    ? like(invoice.number, `${prefix}%`)
    : and(eq(invoice.type, type), like(invoice.number, `${prefix}%`));

  const lastInvoice = await tx.query.invoice.findFirst({
    where,
    orderBy: desc(invoice.number),
    columns: { number: true },
  });

  if (!lastInvoice) {
    if (prefix.includes("-")) {
      return `${prefix}-00000001`;
    }
    return `${prefix}-00000001`; // Standard format PV-NUM
  }

  const parts = lastInvoice.number.split("-");
  const lastNumStr = parts[parts.length - 1];
  const nextNumber = parseInt(lastNumStr) + 1;

  // Rebuild the number with the same prefix structure
  const nextNumStr = String(nextNumber).padStart(8, "0");
  const otherParts = parts.slice(0, -1);

  if (otherParts.length > 0) {
    return `${otherParts.join("-")}-${nextNumStr}`;
  }
  return `${prefix}-${nextNumStr}`;
}

/**
 * Determines the invoice type based on customer billing data.
 */
export function determineInvoiceType(
  customerBillingData: unknown,
  baseType: "FACTURA" | "NOTA_CREDITO" = "FACTURA",
  isPreInvoice: boolean = true,
): InvoiceType {
  const billingData = customerBillingData as { invoiceType?: string } | null;
  const invoiceTypeLetter = billingData?.invoiceType === "A" ? "A" : "B";

  if (baseType === "FACTURA") {
    if (isPreInvoice) {
      return `X_${invoiceTypeLetter}` as InvoiceType;
    }
    return `FACTURA_${invoiceTypeLetter}` as InvoiceType;
  } else {
    if (isPreInvoice) {
      return `NOTA_CREDITO_X_${invoiceTypeLetter}` as InvoiceType;
    }
    return `NOTA_CREDITO_${invoiceTypeLetter}` as InvoiceType;
  }
}

/**
 * Calculates tax breakdown for an invoice based on its items and customer type.
 * Initial implementation: defaults everything to 21% if it's a RI customer (Type A),
 * or includes it in the total if it's B.
 */
export function calculateInvoiceTaxes(
  total: number,
  invoiceType: InvoiceType,
): {
  subtotal: number;
  tax: number;
  iva21: number;
  iva105: number;
} {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isTypeA = invoiceType.endsWith("_A");

  // Regardless of type A or B, for the database and AFIP reporting:
  // total = net (subtotal) + tax
  // For pre-invoices, we assume a standard 21% IVA until we have per-item tax rates.
  const subtotal = total / (1 + DEFAULT_IVA_RATE / 100);
  const tax = total - subtotal;

  return {
    subtotal,
    tax,
    iva21: tax,
    iva105: 0,
  };
}

/**
 * Updates billing data for a DRAFT or REJECTED invoice.
 * If the customerDocType is changed (e.g. from DNI to CUIT), automatically determines
 * the correct new invoice type and re-generates the sequential number.
 */
export async function updateInvoiceBillingData(
  id: string,
  data: {
    customerName?: string;
    customerDoc?: string;
    customerDocType?: string;
  }
) {
  return await db.transaction(async (tx) => {
    const foundInvoice = await tx.query.invoice.findFirst({
      where: eq(invoice.id, id),
    });

    if (!foundInvoice) {
      throw new Error("Comprobante no encontrado");
    }

    if (foundInvoice.status !== 'DRAFT' && foundInvoice.status !== 'REJECTED') {
      throw new Error("Solo se pueden editar comprobantes en estado DRAFT o REJECTED");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedData: any = {};
    if (data.customerName !== undefined) {
      updatedData.customerName = data.customerName;
    }
    if (data.customerDoc !== undefined) {
      updatedData.customerDoc = data.customerDoc;
    }
    if (data.customerDocType !== undefined) {
      updatedData.customerDocType = data.customerDocType;

      // Check if invoice type needs to change based on the document type
      const isCreditNote = foundInvoice.type.startsWith('NOTA_CREDITO_');
      const isPreInvoice = foundInvoice.type.startsWith('X_') || foundInvoice.type.startsWith('NOTA_CREDITO_X_');

      if (isPreInvoice) {
        const letter = data.customerDocType === 'CUIT' ? 'A' : 'B';
        const newType = isCreditNote
          ? (`NOTA_CREDITO_X_${letter}` as InvoiceType)
          : (`X_${letter}` as InvoiceType);

        if (newType !== foundInvoice.type) {
          updatedData.type = newType;
          // Assign next number for the new type
          updatedData.number = await getNextInvoiceNumber(newType, tx);

          // Re-calculate taxes as changing type A <-> B might affect display
          const taxes = calculateInvoiceTaxes(Number(foundInvoice.total), newType);
          updatedData.subtotal = taxes.subtotal.toString();
          updatedData.tax = taxes.tax.toString();
          updatedData.iva21 = taxes.iva21.toString();
          updatedData.iva105 = taxes.iva105.toString();
        }
      }
    }

    const [updated] = await tx
      .update(invoice)
      .set(updatedData)
      .where(eq(invoice.id, id))
      .returning();

    return updated;
  });
}
