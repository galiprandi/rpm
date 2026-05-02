import { NextRequest, NextResponse } from 'next/server';
import { withAdminDynamic } from '@/lib/api-middleware';
import { updateCreditNoteStatus } from '@/lib/services/creditNoteService';

export const PATCH = withAdminDynamic(async (request: NextRequest, { params }: { params: { id: string } }, _session) => {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, reason } = body;

    if (!status || !['DRAFT', 'ISSUED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Debe ser DRAFT, ISSUED o CANCELLED' },
        { status: 400 }
      );
    }

    const updated = await updateCreditNoteStatus(id, status, reason);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating credit note status:', error);

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
