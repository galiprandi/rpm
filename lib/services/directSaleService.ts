/**
 * Service for direct sales (sales without work orders)
 */
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

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
}

/**
 * Create a direct sale with items and payments
 * Also updates stock for products
 */
export async function createDirectSale(input: CreateDirectSaleInput) {
  const { customerId, customerName, items, payments, notes, createdBy } = input;

  // Calculate total
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Validate payments match total
  const paymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  if (Math.abs(paymentsTotal - total) > 0.01) {
    throw new Error('El total de pagos no coincide con el total de la venta');
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
    const directSale = await tx.directSale.create({
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
      await tx.directSaleItem.create({
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
            reason: `Venta directa #${directSale.id.slice(-6)}`,
            userName: createdBy,
          },
        });
      }
    }

    // Create payments
    for (const payment of payments) {
      await tx.directSalePayment.create({
        data: {
          directSaleId: directSale.id,
          paymentMethodId: payment.paymentMethodId,
          amount: payment.amount,
          notes: payment.notes,
          createdBy,
        },
      });
    }

    return directSale;
  });

  return result;
}

/**
 * Get direct sales by date range
 */
export async function getDirectSalesByDateRange(startDate: Date, endDate: Date) {
  return prisma.directSale.findMany({
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

  const sales = await prisma.directSale.findMany({
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
