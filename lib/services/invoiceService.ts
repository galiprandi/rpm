import { db, type Database } from "@/lib/db";
import { invoice, workOrderItem, directSaleItem, creditNoteItem, creditNote } from "@/db/schema";
import { eq, and, or, gte, lte, ilike, like, desc, sql, type SQL } from "drizzle-orm";

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
 * Calculates detailed tax breakdown by querying the items associated with a Work Order, Direct Sale, or Credit Note.
 * Assumes:
 * - Products have 21% IVA rate (divisor 1.21).
 * - Services have 10.5% IVA rate (divisor 1.105).
 * Fits the exact total of the invoice by applying proportional scaling if there is any cent/rounding discrepancy.
 */
export async function calculateDetailedTaxesFromItems(
  referenceId: string,
  referenceType: "work_order" | "direct_sale" | "credit_note",
  total: number,
  tx: DbOrTx = db,
): Promise<{
  subtotal: number;
  tax: number;
  iva21: number;
  iva105: number;
}> {
  try {
    let iva21Sum = 0;
    let iva105Sum = 0;
    let net21Sum = 0;
    let net105Sum = 0;

    if (referenceType === "work_order") {
      const woItems = await tx.query.workOrderItem.findMany({
        where: eq(workOrderItem.workOrderId, referenceId),
      });
      if (Array.isArray(woItems)) {
        for (const item of woItems) {
          const itemTotal = Number(item.subtotal);
          if (item.type === "service") {
            const net = itemTotal / 1.105;
            net105Sum += net;
            iva105Sum += (itemTotal - net);
          } else {
            const net = itemTotal / 1.21;
            net21Sum += net;
            iva21Sum += (itemTotal - net);
          }
        }
      }
    } else if (referenceType === "direct_sale") {
      const saleItems = await tx.query.directSaleItem.findMany({
        where: eq(directSaleItem.directSaleId, referenceId),
      });
      if (Array.isArray(saleItems)) {
        for (const item of saleItems) {
          const itemTotal = Number(item.totalPrice);
          if (item.serviceId) {
            const net = itemTotal / 1.105;
            net105Sum += net;
            iva105Sum += (itemTotal - net);
          } else {
            const net = itemTotal / 1.21;
            net21Sum += net;
            iva21Sum += (itemTotal - net);
          }
        }
      }
    } else if (referenceType === "credit_note") {
      const cnItems = await tx.query.creditNoteItem.findMany({
        where: eq(creditNoteItem.creditNoteId, referenceId),
      });
      if (Array.isArray(cnItems)) {
        for (const item of cnItems) {
          const itemTotal = Number(item.totalPrice);
          if (item.serviceId) {
            const net = itemTotal / 1.105;
            net105Sum += net;
            iva105Sum += (itemTotal - net);
          } else {
            const net = itemTotal / 1.21;
            net21Sum += net;
            iva21Sum += (itemTotal - net);
          }
        }
      }
    }

    const calculatedSubtotal = net21Sum + net105Sum;
    const calculatedTax = iva21Sum + iva105Sum;
    const calculatedTotal = calculatedSubtotal + calculatedTax;

    if (calculatedTotal > 0) {
      // Proportional scaling to match the exact input total (avoids float/cent differences)
      const scale = total / calculatedTotal;
      const subtotal = Number((calculatedSubtotal * scale).toFixed(2));
      const iva21 = Number((iva21Sum * scale).toFixed(2));
      const iva105 = Number((iva105Sum * scale).toFixed(2));
      const tax = Number((iva21 + iva105).toFixed(2));

      // Let's adjust subtotal slightly if there's a 0.01 discrepancy between subtotal + tax and total
      const totalDifference = Number((total - (subtotal + tax)).toFixed(2));
      const adjustedSubtotal = Number((subtotal + totalDifference).toFixed(2));

      return {
        subtotal: adjustedSubtotal,
        tax,
        iva21,
        iva105,
      };
    }
  } catch (error) {
    console.error("Error calculating detailed taxes from items, falling back to flat rate:", error);
  }

  // Fallback to flat rate calculation
  const subtotal = total / (1 + DEFAULT_IVA_RATE / 100);
  const tax = total - subtotal;
  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    iva21: Number(tax.toFixed(2)),
    iva105: 0,
  };
}

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
      taxes = await calculateDetailedTaxesFromItems(
        data.referenceId,
        data.referenceType,
        data.total,
        transaction,
      );
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
  return await db.transaction(async (tx) => {
    const [updated] = await tx
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

    // If a Credit Note invoice is officialized, automatically annul the original invoice
    if (updated && updated.type.startsWith("NOTA_CREDITO_") && updated.referenceType === "credit_note") {
      const creditNoteRecord = await tx.query.creditNote.findFirst({
        where: eq(creditNote.id, updated.referenceId),
      });

      if (creditNoteRecord) {
        // Find the original invoice linked to the original sale or work order
        const originalInvoice = await tx.query.invoice.findFirst({
          where: and(
            eq(invoice.referenceId, creditNoteRecord.originalSaleId),
            eq(invoice.referenceType, creditNoteRecord.originalSaleType)
          ),
        });

        if (originalInvoice) {
          await tx
            .update(invoice)
            .set({
              status: "ANNULLED",
            })
            .where(eq(invoice.id, originalInvoice.id))
            .returning();
        }
      }
    }

    return updated;
  });
}

/**
 * Calculates and returns the next invoice number for a given type.
 * Uses a Postgres advisory lock to prevent race conditions when two
 * concurrent requests try to generate the same number.
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

  // Acquire a transaction-scoped advisory lock keyed by a stable hash of the type.
  // This prevents two concurrent transactions from reading the same last number
  // and generating duplicates. The lock is automatically released on commit/rollback.
  const lockKey = hashTypeToLockKey(type);
  await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);

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
          const taxes = await calculateDetailedTaxesFromItems(
            foundInvoice.referenceId,
            foundInvoice.referenceType as "work_order" | "direct_sale" | "credit_note",
            Number(foundInvoice.total),
            tx,
          );
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

/**
 * Hashes an invoice type string to a stable int32 for use as a Postgres
 * advisory lock key. Uses a simple DJB2 hash to keep it deterministic and
 * collision-resistant across the small set of known types.
 */
function hashTypeToLockKey(type: string): number {
  let hash = 5381;
  for (let i = 0; i < type.length; i++) {
    hash = ((hash << 5) + hash + type.charCodeAt(i)) | 0;
  }
  // Ensure positive int32 for pg_advisory_xact_lock (bigint input)
  return Math.abs(hash);
}
