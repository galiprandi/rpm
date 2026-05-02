import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { createCreditNote, getCreditNotes } from '@/lib/services/creditNoteService';
import { isCashRegisterOpen } from '@/lib/services/cashMovementService';

export const POST = withAdmin(async (request: NextRequest, session) => {
  try {
    const body = await request.json();
    const {
      originalSaleId,
      originalSaleType,
      customerId,
      items,
      refundMethod,
      cashAmount,
      accountCreditAmount,
      refundMethodCode,
      notes,
    } = body;

    // Validate required fields
    if (!originalSaleId || !originalSaleType || !customerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: originalSaleId, originalSaleType, customerId, items' },
        { status: 400 }
      );
    }

    if (!['direct_sale', 'work_order'].includes(originalSaleType)) {
      return NextResponse.json(
        { error: 'originalSaleType debe ser direct_sale o work_order' },
        { status: 400 }
      );
    }

    if (!['CASH', 'ACCOUNT_CREDIT', 'MIXED'].includes(refundMethod)) {
      return NextResponse.json(
        { error: 'refundMethod debe ser CASH, ACCOUNT_CREDIT o MIXED' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.name || !item.quantity || !item.unitPrice || !item.totalPrice) {
        return NextResponse.json(
          { error: 'Los items deben tener nombre, cantidad, precio unitario y precio total' },
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

    // Check cash register is open if refund method includes CASH
    if (refundMethod === 'CASH' || refundMethod === 'MIXED') {
      const isOpen = await isCashRegisterOpen();
      if (!isOpen) {
        return NextResponse.json(
          { error: 'La caja está cerrada. Debe abrir la caja para realizar reintegros en efectivo.' },
          { status: 400 }
        );
      }

      // Validate refund method code for CASH
      if (refundMethod === 'CASH' && !refundMethodCode) {
        return NextResponse.json(
          { error: 'Debe especificar el método de pago para reintegro en efectivo' },
          { status: 400 }
        );
      }

      // Validate refund method code for MIXED
      if (refundMethod === 'MIXED' && !refundMethodCode) {
        return NextResponse.json(
          { error: 'Debe especificar el método de pago para la parte en efectivo' },
          { status: 400 }
        );
      }
    }

    const result = await createCreditNote({
      originalSaleId,
      originalSaleType,
      customerId,
      items,
      refundMethod,
      cashAmount,
      accountCreditAmount,
      refundMethodCode,
      notes,
      createdBy: session.user.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating credit note:', error);

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

export const GET = withAdmin(async (request: NextRequest, _session) => {
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
