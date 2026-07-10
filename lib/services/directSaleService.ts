/**
 * Service for direct sales (sales without work orders)
 */
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { createCashMovement } from "./cashMovementService";
import { createInvoice, determineInvoiceType, type InvoiceType } from "./invoiceService";
import { revalidatePath } from "next/cache";
import { invalidateCashStatus } from "@/lib/cache";
import { getArgentinaStartOfDay, getArgentinaEndOfDay } from "@/lib/utils/date";

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
  existingTx?: any
) {
  const execute = async (tx: any) => {
    // Fetch direct sale with items and customer
    const directSale = await tx.direct_sale.findUnique({
      where: { id: directSaleId },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!directSale) {
      throw new Error('Venta no encontrada');
    }

    const customer = directSale.customer;
    const billingData = customer?.billingData;

    // Determine document type
    const docType = options.type || determineInvoiceType(billingData, 'FACTURA', true);

    // Check if a document of this type already exists to avoid duplicates
    if (!options.forceNew) {
      const existingDocument = await tx.invoice.findFirst({
        where: {
          referenceId: directSaleId,
          referenceType: 'direct_sale',
          type: docType,
          status: { notIn: ['CANCELLED', 'ANNULLED'] },
        },
      });

      if (existingDocument) {
        return existingDocument;
      }
    }

    let customerDoc: string | undefined = undefined;
    let customerDocType: string | undefined = undefined;

    if (billingData && typeof billingData === 'object') {
      const bd = billingData as any;
      customerDoc = bd.cuit || bd.dni || undefined;
      customerDocType = bd.cuit ? 'CUIT' : (bd.dni ? 'DNI' : undefined);
    }

    const total = Number(directSale.total);

    // Create the invoice/document
    return await createInvoice({
      type: docType,
      referenceId: directSale.id,
      referenceType: 'direct_sale',
      customerId: directSale.customerId,
      customerName: directSale.customerName,
      customerDoc,
      customerDocType,
      subtotal: total,
      total: total,
      status: 'DRAFT',
      createdBy,
    }, tx);
  };

  if (existingTx) {
    return execute(existingTx);
  }

  return await prisma.$transaction(execute);
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
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, stock: true, name: true },
        })
      : Promise.resolve([]),
    paymentMethodIds.length > 0
      ? prisma.payment_method.findMany({
          where: { id: { in: paymentMethodIds } },
          select: { id: true, code: true },
        })
      : Promise.resolve([]),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const paymentMethodMap = new Map(paymentMethods.map((pm) => [pm.id, pm]));

  // Validate stock for products before starting transaction
  for (const item of items) {
    if (item.productId) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new Error(`Producto no encontrado: ${item.name}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`,
        );
      }
    }
  }

  // Create direct sale in a transaction with extended timeout
  const result = await prisma.$transaction(
    async (tx) => {
      // Create direct sale
      const directSale = await tx.direct_sale.create({
        data: {
          customerId,
          customerName,
          total,
          notes,
          createdBy,
        },
      });

      // Create items in bulk - we must provide IDs because cuid() is not handled by createMany in some Prisma versions/DBs
      await tx.direct_sale_item.createMany({
        data: items.map((item) => ({
          id: randomUUID(),
          directSaleId: directSale.id,
          productId: item.productId,
          serviceId: item.serviceId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      });

      // Update stock and create stock movements
      for (const item of items) {
        if (item.productId) {
          // Re-fetch within transaction to ensure data consistency
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true, name: true },
          });

          if (!product) {
            throw new Error(`Producto no encontrado: ${item.name}`);
          }

          if (product.stock < item.quantity) {
            throw new Error(
              `Stock insuficiente para ${product.name} (actualización concurrente)`,
            );
          }

          const previousStock = product.stock;
          const newStock = previousStock - item.quantity;

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: newStock,
              lastMovementAt: new Date(),
            },
          });

          // Create stock movement
          await tx.stock_movement.create({
            data: {
              id: randomUUID(),
              productId: item.productId,
              quantity: -item.quantity,
              type: "OUT",
              previousStock,
              newStock,
              reason: `Venta directa - ${customerName || "Consumidor final"}`,
              userName: createdBy,
            },
          });
        }
      }

      // Create payments
      for (const payment of payments) {
        const paymentRecord = await tx.direct_sale_payment.create({
          data: {
            directSaleId: directSale.id,
            paymentMethodId: payment.paymentMethodId,
            amount: payment.amount,
            notes: payment.notes,
            createdBy,
          },
        });

        // Use pre-fetched payment method
        const paymentMethod = paymentMethodMap.get(payment.paymentMethodId);

        // Create cash movement
        await createCashMovement(
          {
            type: "INCOME",
            amount: payment.amount,
            method: paymentMethod?.code || "CASH",
            referenceId: paymentRecord.id,
            referenceType: "direct_sale_payment",
            reason: `Venta directa - ${customerName || "Consumidor final"}`,
            createdBy,
          },
          tx,
        );
      }

      // For credit sales, update customer balance
      if (sellOnCredit && customerId && remaining > 0) {
        const customer = await tx.customer.findUnique({
          where: { id: customerId },
          select: { balance: true, name: true },
        });

        if (!customer) {
          throw new Error("Cliente no encontrado");
        }

        // Helper to convert Decimal to number
        const decimalToNumber = (decimal: unknown): number => {
          if (decimal === null || decimal === undefined) return 0;
          if (typeof decimal === "number") return decimal;
          if (
            typeof decimal === "object" &&
            "toNumber" in decimal &&
            typeof (decimal as { toNumber: () => number }).toNumber ===
              "function"
          ) {
            return (decimal as { toNumber: () => number }).toNumber();
          }
          return 0;
        };

        const currentBalance = decimalToNumber(customer.balance);
        const newBalance = currentBalance + remaining;

        await tx.customer.update({
          where: { id: customerId },
          data: {
            balance: newBalance,
          },
        });

        // Note: The remaining debt is tracked in customer.balance
        // No separate payment record needed - the balance is the source of truth
      }

      // --- Generate Pre-Invoice ---
      try {
        // Re-fetch customer to get billingData
        let billingData = null;
        let customerDoc: string | undefined = undefined;
        let customerDocType: string | undefined = undefined;

        if (customerId) {
          const customer = await tx.customer.findUnique({
            where: { id: customerId },
            select: { billingData: true },
          });
          billingData = customer?.billingData;

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
            referenceId: directSale.id,
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

      return directSale;
    },
    {
      timeout: 15000, // Increase timeout to 15 seconds for sales with many items
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
  return prisma.direct_sale.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      customer: {
        select: { name: true, phone: true },
      },
      items: true,
      payments: {
        include: {
          paymentMethod: {
            select: { name: true, code: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get direct sales summary for a date
 */
export async function getDirectSalesSummaryForDate(date: Date) {
  const startOfDay = getArgentinaStartOfDay(date);
  const endOfDay = getArgentinaEndOfDay(date);

  const sales = await prisma.direct_sale.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      payments: {
        include: {
          paymentMethod: {
            select: { code: true },
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
    .flatMap((sale: unknown) => (sale as { payments: unknown[] }).payments)
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
  return prisma.direct_sale.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          balance: true,
        },
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true, sku: true },
          },
          service: {
            select: { id: true, name: true },
          },
        },
      },
      payments: {
        include: {
          paymentMethod: {
            select: { id: true, name: true, code: true },
          },
        },
      },
    },
  });
}
