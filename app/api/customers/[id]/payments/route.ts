import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/lib/auth/roles';
import { revalidatePath } from 'next/cache';

// Helper para convertir Decimal a number
function decimalToNumber(decimal: unknown): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === 'number') return decimal;
  if (typeof decimal === 'object' && 'toNumber' in decimal && typeof (decimal as { toNumber: () => number }).toNumber === 'function') {
    return (decimal as { toNumber: () => number }).toNumber();
  }
  return 0;
}

// POST /api/customers/[id]/payments - Register a payment against customer's balance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has required role (STAFF or ADMIN)
    const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;
    const roleHierarchy = {
      [UserRole.USER]: 0,
      [UserRole.STAFF]: 1,
      [UserRole.ADMIN]: 2,
    };

    if (roleHierarchy[userRole] < roleHierarchy[UserRole.STAFF]) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { amount, method, notes } = body;

    // Validate required fields
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number' },
        { status: 400 }
      );
    }

    if (!method || typeof method !== 'string') {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        work_order: {
          where: {
            status: {
              notIn: ['CANCELLED', 'PAID'],
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if customer has balance to pay
    const currentBalance = decimalToNumber(customer.balance);
    if (currentBalance <= 0) {
      return NextResponse.json(
        { error: 'Customer has no outstanding balance' },
        { status: 400 }
      );
    }

    // Validate payment amount doesn't exceed balance (optional, can allow overpayment)
    if (amount > currentBalance) {
      return NextResponse.json(
        { error: `Payment amount exceeds balance. Max allowed: ${currentBalance}` },
        { status: 400 }
      );
    }

    // Calculate new balance
    const newBalance = currentBalance - amount;

    // Start transaction: update customer balance and update work orders if balance is 0
    const result = await prisma.$transaction(async (tx) => {
      // Update customer balance
      const updatedCustomer = await tx.customer.update({
        where: { id },
        data: {
          balance: newBalance,
        },
      });

      // Create a cash movement record for this payment
      const paymentMovement = await tx.cash_movement.create({
        data: {
          type: 'INCOME',
          amount,
          method,
          referenceType: 'customer_payment',
          referenceId: id,
          reason: 'Pago de cuenta corriente',
          notes: notes || undefined,
          createdBy: session.user.id,
        },
      });

      // If balance is now 0 or negative, mark all pending work orders as PAID
      if (newBalance <= 0) {
        await tx.work_order.updateMany({
          where: {
            customerId: id,
            status: {
              notIn: ['CANCELLED', 'PAID'],
            },
          },
          data: {
            status: 'PAID',
          },
        });
      }

      return { updatedCustomer, paymentMovement };
    });

    // Revalidate relevant paths
    revalidatePath(`/adm/customers/${id}`);
    revalidatePath('/adm/customers');
    revalidatePath('/adm/work-orders');

    return NextResponse.json(
      {
        success: true,
        payment: {
          id: result.paymentMovement.id,
          amount: result.paymentMovement.amount,
          method: result.paymentMovement.method,
          notes: result.paymentMovement.notes,
          createdAt: result.paymentMovement.createdAt,
        },
        customer: {
          id: result.updatedCustomer.id,
          name: result.updatedCustomer.name,
          previousBalance: currentBalance,
          newBalance: decimalToNumber(result.updatedCustomer.balance),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering payment:', error);
    return NextResponse.json(
      { error: 'Failed to register payment' },
      { status: 500 }
    );
  }
}
