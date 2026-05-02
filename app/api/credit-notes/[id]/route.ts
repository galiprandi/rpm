import { NextRequest, NextResponse } from 'next/server';
import { withAdminDynamic } from '@/lib/api-middleware';
import { getCreditNoteById } from '@/lib/services/creditNoteService';

export const GET = withAdminDynamic(async (request: NextRequest, { params }: { params: { id: string } }, _session) => {
  try {
    const { id } = params;

    const creditNote = await getCreditNoteById(id);

    if (!creditNote) {
      return NextResponse.json(
        { error: 'Nota de crédito no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(creditNote);
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
