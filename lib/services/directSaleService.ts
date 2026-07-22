/**
 * Service for direct sales (sales without work orders)
 */
import { db, type Database } from "@/lib/db";
import { directSale, directSaleItem, directSalePayment, product, paymentMethod, stockMovement, customer, invoice } from "@/db/schema";
import { eq, and, gte, lte, notInArray, inArray, desc, type SQL } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createCashMovement } from "./cashMovementService";
import {
  createInvoice,
  determineInvoiceType,
  type InvoiceType,
} from "./invoiceService";
import { revalidatePath } from "next/cache";
import { invalidateCashStatus } from "@/lib/cache";
import { getArgentinaStartOfDay, getArgentinaEndOfDay } from "@/lib/utils/date";
import { adjustBalanceAtomically } from "./balanceService";

type DbOrTx = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

export interface DirectSaleItemInput {
  productId?: string;
  serviceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface DirectSalePaymentInput {
  paymentMethodId: string;
  amount: number;
  notes?: string;
}

export interface CreateDirectSaleInput {
  customerId?: string;
  customerName: string; // "Consumidor final" or customer name
  items: DirectSaleItemInput[];
  payments: DirectSalePaymentInput[];
  notes?: string;
  createdBy: string;
  sellOnCredit?: boolean;
  remainingAmount?: number;
}

/**
 * Generates a document (Pre-invoice, Presupuesto, Remito) from a Direct Sale.
 */
export async function generateDocumentFromDirectSale(
  directSaleId: string,
  createdBy: string,
  options: { type?: InvoiceType; forceNew?: boolean } = {},
  existingTx?: DbOrTx,
) {
  const execute = async (tx: DbOrTx) => {
    // Fetch direct sale with items and customer
    const sale = await tx.query.directSale.findFirst({
      where: eq(directSale.id, directSaleId),
      with: {
        customer: true,
        directSaleItems: true,
      },
    });

    if (!sale) {
      throw new Error("Venta no encontrada");
    }

    const foundCustomer = sale.customer;
    const billingData = foundCustomer?.billingData;

    // Determine document type
    const docType =
      options.type || determineInvoiceType(billingData, "FACTURA", true);

    // Check if a document of this type already exists to avoid duplicates
    if (!options.forceNew) {
      const existingDocument = await tx.query.invoice.findFirst({
        where: and(
          eq(invoice.referenceId, directSaleId),
          eq(invoice.referenceType, "direct_sale"),
          eq(invoice.type, docType),
          notInArray(invoice.status, ["CANCELLED", "ANNULLED"]),
        ),
      });

      if (existingDocument) {
        return existingDocument;
      }
    }

    let customerDoc: string | undefined = undefined;
    let customerDocType: string | undefined = undefined;

    if (billingData && typeof billingData === "object") {
      const bd = billingData as any;
      customerDoc = bd.cuit || bd.dni || undefined;
      customerDocType = bd.cuit ? "CUIT" : bd.dni ? "DNI" : undefined;
    }

    const total = Number(sale.total);

    // Create the invoice/document
    return await createInvoice(
      {
        type: docType,
        referenceId: sale.id,
        referenceType: "direct_sale",
        customerId: sale.customerId ?? undefined,
        customerName: sale.customerName,
        customerDoc,
        customerDocType,
        subtotal: total,
        total: total,
        status: "DRAFT",
        createdBy,
      },
      tx,
    );
  };

  if (existingTx) {
    return execute(existingTx);
  }

  return await db.transaction(execute);
}

/**
 * Create a direct sale with items and payments
 * Also updates stock for products
 * Supports credit sales (account balance) for registered customers
 */
export async function createDirectSale(input: CreateDirectSaleInput) {
  const {
    customerId,
    customerName,
    items,
    payments,
    notes,
    createdBy,
    sellOnCredit,
    remainingAmount,
  } = input;

  // Calculate total
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Calculate payments total
  const paymentsTotal = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const remaining = total - paymentsTotal;

  // For non-credit sales, validate full payment
  if (!sellOnCredit && Math.abs(paymentsTotal - total) > 0.01) {
    throw new Error("El total de pagos no coincide con el total de la venta");
  }

  // For credit sales, validate customer exists and remaining amount matches
  if (sellOnCredit) {
    if (!customerId) {
      throw new Error(
        "Debe seleccionar un cliente para venta a cuenta corriente",
      );
    }
    if (Math.abs(remaining - (remainingAmount || 0)) > 0.01) {
      throw new Error("El monto pendiente no coincide con el calculado");
    }
  }

  // Pre-fetch all products and payment methods to optimize performance and reduce transaction time
  const productIds = items.map((i) => i.productId).filter(Boolean) as string[];
  const paymentMethodIds = payments.map((p) => p.paymentMethodId);

  const [products, paymentMethods] = await Promise.all([
    productIds.length > 0
      ? db.query.product.findMany({
          where: inArray(product.id, productIds),
          columns: { id: true, stock: true, name: true },
        })
      : Promise.resolve([]),
    paymentMethodIds.length > 0
      ? db.query.paymentMethod.findMany({
          where: inArray(paymentMethod.id, paymentMethodIds),
          columns: { id: true, code: true },
        })
      : Promise.resolve([]),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const paymentMethodMap = new Map(paymentMethods.map((pm) => [pm.id, pm]));

  // Validate stock for products before starting transaction
  for (const item of items) {
    if (item.productId) {
      const foundProduct = productMap.get(item.productId);

      if (!foundProduct) {
        throw new Error(`Producto no encontrado: ${item.name}`);
      }

      if (foundProduct.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para ${foundProduct.name}. Disponible: ${foundProduct.stock}, Solicitado: ${item.quantity}`,
        );
      }
    }
  }

  // Create direct sale in a transaction with extended timeout
  const result = await db.transaction(
    async (tx) => {
      // Create direct sale
      const [createdDirectSale] = await tx
        .insert(directSale)
        .values({
          id: randomUUID(),
          customerId: customerId || null,
          customerName,
          total: total.toString(),
          notes,
          createdBy,
        })
        .returning();

      // Create items in bulk
      await tx.insert(directSaleItem).values(
        items.map((item) => ({
          id: randomUUID(),
          directSaleId: createdDirectSale.id,
          productId: item.productId || null,
          serviceId: item.serviceId || null,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
        })),
      );

      // Update stock and create stock movements
      for (const item of items) {
        if (item.productId) {
          // Re-fetch within transaction to ensure data consistency
          const foundProduct = await tx.query.product.findFirst({
            where: eq(product.id, item.productId),
            columns: { stock: true, name: true },
          });

          if (!foundProduct) {
            throw new Error(`Producto no encontrado: ${item.name}`);
          }

          if (foundProduct.stock < item.quantity) {
            throw new Error(
              `Stock insuficiente para ${foundProduct.name} (actualización concurrente)`,
            );
          }

          const previousStock = foundProduct.stock;
          const newStock = previousStock - item.quantity;

          await tx
            .update(product)
            .set({
              stock: newStock,
              lastMovementAt: new Date().toISOString(),
            })
            .where(eq(product.id, item.productId));

          // Create stock movement
          await tx.insert(stockMovement).values({
            id: randomUUID(),
            productId: item.productId,
            quantity: -item.quantity,
            type: "OUT",
            previousStock,
            newStock,
            reason: `Venta directa - ${customerName || "Consumidor final"}`,
            userName: createdBy,
          });
        }
      }

      // Create payments
      for (const payment of payments) {
        const [paymentRecord] = await tx
          .insert(directSalePayment)
          .values({
            id: randomUUID(),
            directSaleId: createdDirectSale.id,
            paymentMethodId: payment.paymentMethodId,
            amount: payment.amount.toString(),
            notes: payment.notes,
            createdBy,
          })
          .returning();

        // Use pre-fetched payment method
        const foundPaymentMethod = paymentMethodMap.get(payment.paymentMethodId);

        // Create cash movement
        await createCashMovement(
          {
            type: "INCOME",
            amount: payment.amount,
            method: foundPaymentMethod?.code || "CASH",
            referenceId: paymentRecord.id,
            referenceType: "direct_sale_payment",
            reason: `Venta directa - ${customerName || "Consumidor final"}`,
            createdBy,
          },
          tx,
        );
      }

      // For credit sales, update customer balance atomically
      if (sellOnCredit && customerId && remaining > 0) {
        await adjustBalanceAtomically(customerId, remaining, "direct_sale", tx);
      }

      // --- Generate Pre-Invoice ---
      try {
        // Re-fetch customer to get billingData
        let billingData = null;
        let customerDoc: string | undefined = undefined;
        let customerDocType: string | undefined = undefined;

        if (customerId) {
          const foundCustomer = await tx.query.customer.findFirst({
            where: eq(customer.id, customerId),
            columns: { billingData: true },
          });
          billingData = foundCustomer?.billingData;

          // Extract doc info from billingData if available
          if (billingData && typeof billingData === "object") {
            const bd = billingData as any;
            customerDoc = bd.cuit || bd.dni || undefined;
            customerDocType = bd.cuit ? "CUIT" : bd.dni ? "DNI" : undefined;
          }
        }

        const invoiceType = determineInvoiceType(billingData, "FACTURA", true);

        // Calculate taxes (basic implementation for now: assuming 21% if billingData allows, otherwise 0)
        // For RI customers we might want to calculate desglosado. For CF, it's included.
        // Initially, let's keep it simple: total is total.

        await createInvoice(
          {
            type: invoiceType,
            referenceId: createdDirectSale.id,
            referenceType: "direct_sale",
            customerId,
            customerName,
            customerDoc,
            customerDocType,
            subtotal: Number(total), // Simplified: total = subtotal for pre-invoices without tax breakdown
            total: Number(total),
            status: "DRAFT",
            createdBy,
          },
          tx,
        );
      } catch (invoiceError) {
        // We don't want to fail the whole sale if invoice generation fails
        console.error(
          "Error generating pre-invoice for direct sale:",
          invoiceError,
        );
      }

      return createdDirectSale;
    },
  );

  // Invalidate dashboard cache to show fresh data
  revalidatePath("/adm");
  invalidateCashStatus();

  return result;
}

/**
 * Get direct sales by date range
 */
export async function getDirectSalesByDateRange(
  startDate: Date,
  endDate: Date,
) {
  return db.query.directSale.findMany({
    where: and(
      gte(directSale.createdAt, startDate.toISOString()),
      lte(directSale.createdAt, endDate.toISOString()),
    ),
    with: {
      customer: {
        columns: { name: true, phone: true },
      },
      directSaleItems: true,
      directSalePayments: {
        with: {
          paymentMethod: {
            columns: { name: true, code: true },
          },
        },
      },
    },
    orderBy: desc(directSale.createdAt),
  });
}

/**
 * Get direct sales summary for a date
 */
export async function getDirectSalesSummaryForDate(date: Date) {
  const startOfDay = getArgentinaStartOfDay(date);
  const endOfDay = getArgentinaEndOfDay(date);

  const sales = await db.query.directSale.findMany({
    where: and(
      gte(directSale.createdAt, startOfDay.toISOString()),
      lte(directSale.createdAt, endOfDay.toISOString()),
    ),
    with: {
      directSalePayments: {
        with: {
          paymentMethod: {
            columns: { code: true },
          },
        },
      },
    },
  });

  const total = sales.reduce(
    (sum: number, sale: unknown) =>
      sum + Number((sale as { total: unknown }).total),
    0,
  );
  const count = sales.length;

  // Group by payment method
  const paymentsByMethod = sales
    .flatMap((sale: unknown) => (sale as { directSalePayments: unknown[] }).directSalePayments)
    .reduce(
      (acc: Record<string, number>, payment: unknown) => {
        const code = (payment as { paymentMethod: { code: string } })
          .paymentMethod.code;
        if (!acc[code]) {
          acc[code] = 0;
        }
        acc[code] += Number((payment as { amount: unknown }).amount);
        return acc;
      },
      {} as Record<string, number>,
    );

  return {
    total,
    count,
    paymentsByMethod,
  };
}

/**
 * Get direct sale by ID with full details
 */
export async function getDirectSaleById(id: string) {
  return db.query.directSale.findFirst({
    where: eq(directSale.id, id),
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
      directSaleItems: {
        with: {
          product: {
            columns: { id: true, name: true, sku: true },
          },
          service: {
            columns: { id: true, name: true },
          },
        },
      },
      directSalePayments: {
        with: {
          paymentMethod: {
            columns: { id: true, name: true, code: true },
          },
        },
      },
    },
  });
}
