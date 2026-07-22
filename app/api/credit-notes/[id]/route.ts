import { NextRequest, NextResponse } from 'next/server';
import { withAdminDynamic } from '@/lib/api-middleware';
import { getCreditNoteById } from '@/lib/services/creditNoteService';
import { toISODate } from '@/lib/utils/date';
import { serializeDrizzleResult } from '@/lib/utils/serialization';

export const GET = withAdminDynamic(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;

    const creditNote = await getCreditNoteById(id);

    if (!creditNote) {
      return NextResponse.json(
        { error: 'Nota de crédito no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeDrizzleResult({
      ...creditNote,
      total: creditNote.total != null ? Number(creditNote.total) : creditNote.total,
      cashAmount: creditNote.cashAmount != null ? Number(creditNote.cashAmount) : creditNote.cashAmount,
      accountCreditAmount: creditNote.accountCreditAmount != null ? Number(creditNote.accountCreditAmount) : creditNote.accountCreditAmount,
      createdAt: toISODate(creditNote.createdAt),
      customer: creditNote.customer
        ? { ...creditNote.customer, balance: Number(creditNote.customer.balance) }
        : creditNote.customer,
      creditNoteItems: (creditNote.creditNoteItems || []).map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        createdAt: toISODate(item.createdAt),
      })),
    }));
  } catch (error) {
    console.error('Error fetching credit note:', error);

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
