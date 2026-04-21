import { prisma } from '@/lib/prisma';
import { getArgentinaStartOfDay, getArgentinaEndOfDay } from '@/lib/utils/date';

export interface CashMovementInput {
  type: 'INCOME' | 'EXPENSE' | 'OPENING' | 'CLOSING' | 'COUNT';
  amount: number;
  method: string;
  referenceId?: string;
  referenceType?: 'work_order_payment' | 'direct_sale_payment' | 'customer_payment' | 'manual';
  reason?: string;
  notes?: string;
  createdBy: string;
}

export async function createCashMovement(
  data: CashMovementInput,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx?: any
) {
  const client = tx || prisma;
  return client.cash_movement.create({
    data: {
      type: data.type,
      amount: data.amount,
      method: data.method,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
      reason: data.reason,
      notes: data.notes,
      createdBy: data.createdBy,
    },
  });
}

export async function getCashMovements(filters: {
  startDate?: Date;
  endDate?: Date;
  type?: string;
  method?: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  if (filters.type) where.type = filters.type;
  if (filters.method) where.method = filters.method;

  return prisma.cash_movement.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCashMovementSummary(date: Date) {
  const startOfDay = getArgentinaStartOfDay(date);
  const endOfDay = getArgentinaEndOfDay(date);

  const movements = await prisma.cash_movement.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const summary = {
    opening: 0,
    income: 0,
    expense: 0,
    closing: 0,
    total: 0,
  };

  for (const movement of movements) {
    const amount = Number(movement.amount);
    switch (movement.type) {
      case 'OPENING':
        summary.opening += amount;
        break;
      case 'INCOME':
        summary.income += amount;
        break;
      case 'EXPENSE':
        summary.expense += amount;
        break;
      case 'CLOSING':
        summary.closing += amount;
        break;
    }
  }

  summary.total = summary.opening + summary.income - summary.expense;

  return summary;
}

/**
 * Checks if there is an open cash register.
 * A register is open if the latest OPENING/CLOSING movement is an OPENING.
 */
export async function isCashRegisterOpen(): Promise<boolean> {
  // Find the absolute latest OPENING or CLOSING movement
  const lastMovement = await prisma.cash_movement.findFirst({
    where: {
      type: {
        in: ['OPENING', 'CLOSING'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // If no opening/closing ever happened, it's closed
  if (!lastMovement) return false;

  // If the last movement was an opening, it's still open
  return lastMovement.type === 'OPENING';
}
