import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { createCreditNote, getCreditNotes } from '@/lib/services/creditNoteService';
import { isCashRegisterOpen } from '@/lib/services/cashMovementService';

export const POST = withAdmin(async (request: NextRequest, session) => {
  try {
    const body = await request.json();
    const { originalSaleId, originalSaleType, items, refundMethod, paymentMethodId, notes } = body;

    if (!originalSaleId || !originalSaleType || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: originalSaleId, originalSaleType, items' },
        { status: 400 }
      );
    }

    if (!['direct_sale', 'work_order'].includes(originalSaleType)) {
      return NextResponse.json(
        { error: 'originalSaleType debe ser direct_sale o work_order' },
        { status: 400 }
      );
    }

    if (!['CASH', 'ACCOUNT_CREDIT'].includes(refundMethod)) {
      return NextResponse.json(
        { error: 'refundMethod debe ser CASH o ACCOUNT_CREDIT' },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.productId && !item.serviceId) {
        return NextResponse.json(
          { error: 'Los items deben tener productId o serviceId' },
          { status: 400 }
        );
      }
      if (!item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Los items deben tener quantity mayor a 0' },
          { status: 400 }
        );
      }
    }

    if (refundMethod === 'CASH') {
      const isOpen = await isCashRegisterOpen();
      if (!isOpen) {
        return NextResponse.json(
          { error: 'La caja esta cerrada. Debe abrir la caja para realizar reintegros en efectivo.' },
          { status: 400 }
        );
      }
      if (!paymentMethodId) {
        return NextResponse.json(
          { error: 'Debe especificar el metodo de pago para reintegro en efectivo' },
          { status: 400 }
        );
      }
    }

    console.log('[CreditNote API] Creating credit note with items:', JSON.stringify(items, null, 2));
    
    const result = await createCreditNote({
      originalSaleId,
      originalSaleType,
      items,
      refundMethod,
      paymentMethodId,
      notes,
      createdBy: session.user.id,
    });
    
    console.log('[CreditNote API] Credit note created successfully:', result.id);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating credit note:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
});

export const GET = withAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const originalSaleId = searchParams.get('originalSaleId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: Record<string, unknown> = {};
    if (customerId) filters.customerId = customerId;
    if (originalSaleId) filters.originalSaleId = originalSaleId;
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const creditNotes = await getCreditNotes(filters);

    return NextResponse.json(creditNotes);
  } catch (error) {
    console.error('Error fetching credit notes:', error);

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
