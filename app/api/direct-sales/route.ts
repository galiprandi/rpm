import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { createDirectSale } from '@/lib/services/directSaleService';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      customerId,
      customerName,
      items,
      payments,
      notes,
    } = body;

    // Validate required fields
    if (!customerName || !items || !payments || items.length === 0 || payments.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
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
      payments,
      notes,
      createdBy: session.user.id,
    });

    return NextResponse.json(directSale, { status: 201 });
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
}
