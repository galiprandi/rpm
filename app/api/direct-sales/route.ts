import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { createDirectSale } from '@/lib/services/directSaleService';
import { isCashRegisterOpen } from '@/lib/services/cashMovementService';
import { db } from '@/lib/db';
import { directSale } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { toISODate } from '@/lib/utils/date';

// GET /api/direct-sales - List direct sales with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const customerId = searchParams.get('customerId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const directSales = await db.query.directSale.findMany({
      where: customerId ? eq(directSale.customerId, customerId) : undefined,
      with: {
        customer: {
          columns: {
            id: true,
            name: true,
            phone: true,
          },
        },
        directSaleItems: true,
        directSalePayments: true,
      },
      orderBy: desc(directSale.createdAt),
      limit,
      offset,
    });

    const totalResult = await db
      .select({ value: count() })
      .from(directSale)
      .where(customerId ? eq(directSale.customerId, customerId) : undefined);
    const total = totalResult[0]?.value || 0;

    // Convert Drizzle raw PG timestamps to ISO 8601 and string decimals to numbers
    const directSalesSerialized = directSales.map((sale) => ({
      ...sale,
      total: Number(sale.total),
      createdAt: toISODate(sale.createdAt),
      directSaleItems: sale.directSaleItems.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      directSalePayments: sale.directSalePayments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
        createdAt: toISODate(payment.createdAt),
      })),
    }));

    return NextResponse.json({ directSales: directSalesSerialized, total, limit, offset });
  } catch (error) {
    console.error('Error fetching direct sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch direct sales' },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(async (request: NextRequest, session) => {
  try {
    // Check if cash register is open
    const isOpen = await isCashRegisterOpen();
    if (!isOpen) {
      return NextResponse.json(
        { error: 'La caja está cerrada. Debe abrir la caja para realizar ventas.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      customerId,
      customerName,
      items,
      payments,
      notes,
      sellOnCredit,
      remainingAmount,
    } = body;

    // Validate required fields
    if (!customerName || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // For non-credit sales, require at least one payment
    if (!sellOnCredit && (!payments || payments.length === 0)) {
      return NextResponse.json(
        { error: 'Debe agregar al menos un pago o activar venta a cuenta corriente' },
        { status: 400 }
      );
    }

    // For credit sales, require customer selection
    if (sellOnCredit && !customerId) {
      return NextResponse.json(
        { error: 'Debe seleccionar un cliente para venta a cuenta corriente' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.name || !item.quantity || !item.unitPrice) {
        return NextResponse.json(
          { error: 'Los items deben tener nombre, cantidad y precio unitario' },
          { status: 400 }
        );
      }

      if (!item.productId && !item.serviceId) {
        return NextResponse.json(
          { error: 'Los items deben tener productId o serviceId' },
          { status: 400 }
        );
      }

      // Compute totalPrice if not provided
      if (item.totalPrice === undefined) {
        item.totalPrice = item.unitPrice * item.quantity;
      }
    }

    // Validate payments
    for (const payment of payments) {
      if (!payment.paymentMethodId || !payment.amount) {
        return NextResponse.json(
          { error: 'Los pagos deben tener paymentMethodId y amount' },
          { status: 400 }
        );
      }
    }

    const directSale = await createDirectSale({
      customerId,
      customerName,
      items,
      payments: payments || [],
      notes,
      sellOnCredit: sellOnCredit || false,
      remainingAmount: remainingAmount || 0,
      createdBy: session.user.id,
    });

    return NextResponse.json(
      {
        ...directSale,
        total: Number(directSale.total),
        createdAt: toISODate(directSale.createdAt),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating direct sale:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});
