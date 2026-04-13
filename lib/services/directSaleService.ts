/**
 * Service for direct sales (sales without work orders)
 */
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { createCashMovement } from './cashMovementService';

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

  // Validate stock for products
  for (const item of items) {
    if (item.productId) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, name: true },
      });

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

  // Create direct sale in a transaction
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

    // Create items and update stock
    for (const item of items) {
      await tx.direct_sale_item.create({
        data: {
          directSaleId: directSale.id,
          productId: item.productId,
          serviceId: item.serviceId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        },
      });

      // Update stock for products
      if (item.productId) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });

        if (!product) {
          throw new Error(`Producto no encontrado: ${item.name}`);
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

      // Get payment method to determine the method code
      const paymentMethod = await tx.payment_method.findUnique({
        where: { id: payment.paymentMethodId },
        select: { code: true },
      });

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
  });

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
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

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
