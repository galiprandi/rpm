/**
 * Credit note service - simplified: operational returns only
 */
import { db, type Database } from "@/lib/db";
import { creditNote, creditNoteItem, directSale, workOrder, product, stockMovement, customer, paymentMethod } from "@/db/schema";
import { eq, and, gte, lte, desc, type SQL } from "drizzle-orm";
import { createCashMovement } from "./cashMovementService";
import { createInvoice, determineInvoiceType } from "./invoiceService";
import { revalidatePath } from "next/cache";
import { invalidateCashStatus } from "@/lib/cache";
import {
  validateCreditNoteCreation,
  type CreateCreditNoteInput,
} from "./creditNoteValidationService";
import { adjustBalanceAtomically } from "./balanceService";

type DbOrTx = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

function decimalToNumber(decimal: unknown): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === "number") return decimal;
  if (typeof decimal === "string") return Number(decimal);
  if (
    typeof decimal === "object" &&
    "toNumber" in decimal &&
    typeof (decimal as { toNumber: () => number }).toNumber === "function"
  ) {
    return (decimal as { toNumber: () => number }).toNumber();
  }
  return 0;
}

// Using 'any' for Drizzle types to avoid complex inferred types with many fields
// that don't match simple interfaces. This is acceptable for service logic.
/* eslint-disable @typescript-eslint/no-explicit-any */
function getOriginalItems(saleType: "direct_sale" | "work_order", sale: any) {
  if (saleType === "direct_sale") {
    return sale.directSaleItems.map((item: any) => ({
      id: item.id,
      productId: item.productId ?? undefined,
      serviceId: item.serviceId ?? undefined,
      quantity: item.quantity,
      unitPrice: decimalToNumber(item.unitPrice),
      name:
        item.name || item.product?.name || item.service?.name || "Sin nombre",
    }));
  }
  return sale.workOrderItems.map((item: any) => ({
    id: item.id,
    productId: item.productId ?? undefined,
    serviceId: item.serviceId ?? undefined,
    quantity: item.quantity,
    unitPrice: decimalToNumber(item.unitPrice),
    name: item.product?.name || item.service?.name || "Sin nombre",
  }));
}

export async function createCreditNote(input: CreateCreditNoteInput) {
  const {
    originalSaleId,
    originalSaleType,
    items,
    refundMethod,
    paymentMethodId,
    paymentMethodCode,
    notes,
    createdBy,
  } = input;

  // Validate using validation service
  const validation = await validateCreditNoteCreation(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }

  // Fetch original sale
  let sale: any;
  let customerId: string;

  if (originalSaleType === "direct_sale") {
    sale = await db.query.directSale.findFirst({
      where: eq(directSale.id, originalSaleId),
      with: {
        directSaleItems: {
          with: {
            product: { columns: { name: true } },
            service: { columns: { name: true } },
          },
        },
        customer: true,
      },
    });
    customerId = sale.customerId;
  } else {
    sale = await db.query.workOrder.findFirst({
      where: eq(workOrder.id, originalSaleId),
      with: {
        workOrderItems: {
          with: {
            product: { columns: { name: true } },
            service: { columns: { name: true } },
          },
        },
        customer: true,
      },
    });
    customerId = sale.customerId;
  }

  // Build credit note items with prices from original sale
  const originalItems = getOriginalItems(originalSaleType, sale);
  const creditNoteItems: Array<{
    productId?: string;
    serviceId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }> = [];

  for (const itemInput of items) {
    const original = originalItems.find(
      (oi: any) =>
        (itemInput.productId && oi.productId === itemInput.productId) ||
        (itemInput.serviceId && oi.serviceId === itemInput.serviceId),
    );

    const unitPrice = decimalToNumber(original.unitPrice);
    const totalPrice = unitPrice * itemInput.quantity;

    creditNoteItems.push({
      productId: itemInput.productId,
      serviceId: itemInput.serviceId,
      name: original.name,
      quantity: itemInput.quantity,
      unitPrice,
      totalPrice,
    });
  }

  const total = creditNoteItems.reduce((sum, item) => sum + item.totalPrice, 0);

  if (total === 0) {
    throw new Error("El total de la nota de credito no puede ser cero");
  }

  if (!customerId) {
    throw new Error("No se puede emitir una nota de credito para una venta sin cliente asociado (Consumidor Final)");
  }

  // Transaction
  const result = await db.transaction(async (tx) => {
    // Create credit note
    const [createdCreditNote] = await tx
      .insert(creditNote)
      .values({
        id: crypto.randomUUID(),
        originalSaleId,
        originalSaleType,
        customerId,
        total: total.toString(),
        refundMethod,
        paymentMethodId: refundMethod === "CASH" ? paymentMethodId || null : null,
        status: "ISSUED",
        notes,
        createdBy,
      })
      .returning();

    // --- Generate Pre-Invoice (Credit Note) ---
    try {
      const foundCustomer = await tx.query.customer.findFirst({
        where: eq(customer.id, customerId),
        columns: { billingData: true, name: true },
      });
      const billingData = foundCustomer?.billingData;

      let customerDoc: string | undefined = undefined;
      let customerDocType: string | undefined = undefined;

      if (billingData && typeof billingData === "object") {
        const bd = billingData as any;
        customerDoc = bd.cuit || bd.dni || undefined;
        customerDocType = bd.cuit ? "CUIT" : bd.dni ? "DNI" : undefined;
      }

      const invoiceType = determineInvoiceType(
        billingData,
        "NOTA_CREDITO",
        true,
      );

      await createInvoice(
        {
          type: invoiceType,
          referenceId: createdCreditNote.id,
          referenceType: "credit_note",
          customerId,
          customerName: foundCustomer?.name || "Cliente",
          customerDoc,
          customerDocType,
          subtotal: Number(total),
          total: Number(total),
          status: "DRAFT",
          createdBy,
        },
        tx,
      );
    } catch (invoiceError) {
      console.error(
        "Error generating pre-invoice for credit note:",
        invoiceError,
      );
    }

    // Create items and update stock
    for (const item of creditNoteItems) {
      await tx.insert(creditNoteItem).values({
        id: crypto.randomUUID(),
        creditNoteId: createdCreditNote.id,
        productId: item.productId || null,
        serviceId: item.serviceId || null,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        totalPrice: item.totalPrice.toString(),
      });

      if (item.productId) {
        const foundProduct = await tx.query.product.findFirst({
          where: eq(product.id, item.productId),
          columns: { stock: true },
        });
        if (!foundProduct) throw new Error(`Producto no encontrado: ${item.name}`);

        const previousStock = foundProduct.stock;
        const newStock = previousStock + item.quantity;

        console.log(
          `[CreditNote] Updating stock for product ${item.productId}: ${previousStock} -> ${newStock} (+${item.quantity})`,
        );

        await tx
          .update(product)
          .set({ stock: newStock, lastMovementAt: new Date().toISOString() })
          .where(eq(product.id, item.productId));

        await tx.insert(stockMovement).values({
          id: crypto.randomUUID(),
          productId: item.productId,
          quantity: item.quantity,
          type: "IN",
          previousStock,
          newStock,
          reason: `Devolucion NC #${createdCreditNote.id}`,
          reasonDetails: notes,
          userName: createdBy,
        });

        console.log(
          `[CreditNote] Stock movement created for NC ${createdCreditNote.id}`,
        );
      }
    }

    // Cash movement if CASH
    if (refundMethod === "CASH") {
      await createCashMovement(
        {
          type: "EXPENSE",
          amount: total,
          method: paymentMethodCode || "CASH",
          referenceId: createdCreditNote.id,
          referenceType: "credit_note_refund",
          reason: `Reintegro NC #${createdCreditNote.id}`,
          notes,
          createdBy,
        },
        tx,
      );
    }

    // Update customer balance if ACCOUNT_CREDIT
    if (refundMethod === "ACCOUNT_CREDIT") {
      await adjustBalanceAtomically(customerId, -total, "credit_note", tx);
    }

    return createdCreditNote;
  });

  // Invalidate dashboard cache to show fresh data
  revalidatePath("/adm");
  invalidateCashStatus();

  return result;
}

export async function getCreditNotes(filters: {
  customerId?: string;
  originalSaleId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const conditions: SQL[] = [];
  if (filters.customerId) conditions.push(eq(creditNote.customerId, filters.customerId));
  if (filters.originalSaleId) conditions.push(eq(creditNote.originalSaleId, filters.originalSaleId));
  if (filters.status) conditions.push(eq(creditNote.status, filters.status));
  if (filters.startDate) conditions.push(gte(creditNote.createdAt, filters.startDate.toISOString()));
  if (filters.endDate) conditions.push(lte(creditNote.createdAt, filters.endDate.toISOString()));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const notes = await db.query.creditNote.findMany({
    where,
    with: {
      customer: { columns: { id: true, name: true, phone: true } },
      creditNoteItems: { columns: { id: true } },
    },
    orderBy: desc(creditNote.createdAt),
  });

  // Compute item counts manually (Drizzle has no built-in _count)
  return notes.map((note) => ({
    ...note,
    _count: { items: note.creditNoteItems.length },
  }));
}

export async function getCreditNoteById(id: string) {
  return db.query.creditNote.findFirst({
    where: eq(creditNote.id, id),
    with: {
      customer: {
        columns: {
          id: true,
          name: true,
          phone: true,
          email: true,
          balance: true,
        },
      },
      creditNoteItems: {
        with: {
          product: { columns: { id: true, name: true } },
          service: { columns: { id: true, name: true } },
        },
      },
      paymentMethod: { columns: { id: true, name: true, code: true } },
    },
  });
}

export async function cancelCreditNote(id: string, reason?: string) {
  const result = await db.transaction(async (tx) => {
    const foundCreditNote = await tx.query.creditNote.findFirst({
      where: eq(creditNote.id, id),
      with: {
        creditNoteItems: true,
        paymentMethod: { columns: { code: true } },
      },
    });

    if (!foundCreditNote) throw new Error("Nota de credito no encontrada");
    if (foundCreditNote.status === "CANCELLED")
      throw new Error("La nota de credito ya esta cancelada");

    // Reverse stock
    for (const item of foundCreditNote.creditNoteItems) {
      if (item.productId) {
        const foundProduct = await tx.query.product.findFirst({
          where: eq(product.id, item.productId),
          columns: { stock: true },
        });
        if (foundProduct) {
          const previousStock = foundProduct.stock;
          const newStock = previousStock - item.quantity;
          await tx
            .update(product)
            .set({ stock: newStock, lastMovementAt: new Date().toISOString() })
            .where(eq(product.id, item.productId));
          await tx.insert(stockMovement).values({
            id: crypto.randomUUID(),
            productId: item.productId,
            quantity: -item.quantity,
            type: "OUT",
            previousStock,
            newStock,
            reason: `Cancelacion NC #${id}`,
            reasonDetails: reason,
            userName: "system",
          });
        }
      }
    }

    // Reverse cash movement if CASH
    if (foundCreditNote.refundMethod === "CASH" && foundCreditNote.paymentMethodId) {
      await createCashMovement(
        {
          type: "INCOME",
          amount: Number(foundCreditNote.total),
          method: foundCreditNote.paymentMethod?.code || "CASH",
          referenceId: id,
          referenceType: "credit_note_cancelled",
          reason: `Cancelacion NC #${id}`,
          notes: reason,
          createdBy: "system",
        },
        tx,
      );
    }

    // Reverse customer balance if ACCOUNT_CREDIT
    if (foundCreditNote.refundMethod === "ACCOUNT_CREDIT") {
      await adjustBalanceAtomically(
        foundCreditNote.customerId,
        Number(foundCreditNote.total),
        "credit_note_cancel",
        tx,
      );
    }

    const [updated] = await tx
      .update(creditNote)
      .set({ status: "CANCELLED" })
      .where(eq(creditNote.id, id))
      .returning();

    return updated;
  });

  invalidateCashStatus();
  return result;
}
