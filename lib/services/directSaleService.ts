/**
 * Service for direct sales (sales without work orders)
 */
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { createCashMovement } from './cashMovementService';
import { revalidatePath } from 'next/cache';
import { getArgentinaStartOfDay, getArgentinaEndOfDay } from '@/lib/utils/date';

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
 * Create a direct sale with items and payments
 * Also updates stock for products
 * Supports credit sales (account balance) for registered customers
 */
export async function createDirectSale(input: CreateDirectSaleInput) {
  const { customerId, customerName, items, payments, notes, createdBy, sellOnCredit, remainingAmount } = input;

  // Calculate total
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Calculate payments total
  const paymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = total - paymentsTotal;

  // For non-credit sales, validate full payment
  if (!sellOnCredit && Math.abs(paymentsTotal - total) > 0.01) {
    throw new Error('El total de pagos no coincide con el total de la venta');
  }

  // For credit sales, validate customer exists and remaining amount matches
  if (sellOnCredit) {
    if (!customerId) {
      throw new Error('Debe seleccionar un cliente para venta a cuenta corriente');
    }
    if (Math.abs(remaining - (remainingAmount || 0)) > 0.01) {
      throw new Error('El monto pendiente no coincide con el calculado');
    }
  }

  // Pre-fetch all products and payment methods to optimize performance and reduce transaction time
  const productIds = items.map(i => i.productId).filter(Boolean) as string[];
  const paymentMethodIds = payments.map(p => p.paymentMethodId);

  const [products, paymentMethods] = await Promise.all([
    productIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, stock: true, name: true }
        })
      : Promise.resolve([]),
    paymentMethodIds.length > 0
      ? prisma.payment_method.findMany({
          where: { id: { in: paymentMethodIds } },
          select: { id: true, code: true }
        })
      : Promise.resolve([])
  ]);

  const productMap = new Map(products.map(p => [p.id, p]));
  const paymentMethodMap = new Map(paymentMethods.map(pm => [pm.id, pm]));

  // Validate stock for products before starting transaction
  for (const item of items) {
    if (item.productId) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new Error(`Producto no encontrado: ${item.name}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`
        );
      }
    }
  }

  // Create direct sale in a transaction with extended timeout
  const result = await prisma.$transaction(async (tx) => {
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

    // Create items in bulk
    await tx.direct_sale_item.createMany({
      data: items.map(item => ({
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
          throw new Error(`Stock insuficiente para ${product.name} (actualización concurrente)`);
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
            type: 'OUT',
            previousStock,
            newStock,
            reason: `Venta directa - ${customerName || 'Consumidor final'}`,
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
          type: 'INCOME',
          amount: payment.amount,
          method: paymentMethod?.code || 'CASH',
          referenceId: paymentRecord.id,
          referenceType: 'direct_sale_payment',
          reason: `Venta directa - ${customerName || 'Consumidor final'}`,
          createdBy,
        },
        tx
      );
    }

    // For credit sales, update customer balance
    if (sellOnCredit && customerId && remaining > 0) {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { balance: true, name: true },
      });

      if (!customer) {
        throw new Error('Cliente no encontrado');
      }

      // Helper to convert Decimal to number
      const decimalToNumber = (decimal: unknown): number => {
        if (decimal === null || decimal === undefined) return 0;
        if (typeof decimal === 'number') return decimal;
        if (typeof decimal === 'object' && 'toNumber' in decimal && typeof (decimal as { toNumber: () => number }).toNumber === 'function') {
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

    return directSale;
  }, {
    timeout: 15000, // Increase timeout to 15 seconds for sales with many items
  });

  // Invalidate dashboard cache to show fresh data
  revalidatePath('/adm');

  return result;
}

/**
 * Get direct sales by date range
 */
export async function getDirectSalesByDateRange(startDate: Date, endDate: Date) {
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
    orderBy: { createdAt: 'desc' },
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

  const total = sales.reduce((sum: number, sale: unknown) => sum + Number((sale as { total: unknown }).total), 0);
  const count = sales.length;

  // Group by payment method
  const paymentsByMethod = sales.flatMap((sale: unknown) => (sale as { payments: unknown[] }).payments).reduce(
    (acc: Record<string, number>, payment: unknown) => {
      const code = (payment as { paymentMethod: { code: string } }).paymentMethod.code;
      if (!acc[code]) {
        acc[code] = 0;
      }
      acc[code] += Number((payment as { amount: unknown }).amount);
      return acc;
    },
    {} as Record<string, number>
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
        select: { id: true, name: true, phone: true, email: true, balance: true },
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
