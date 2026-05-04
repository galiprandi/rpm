import { NextRequest, NextResponse } from 'next/server';
import { withAdminDynamic } from '@/lib/api-middleware';
import { cancelCreditNote } from '@/lib/services/creditNoteService';

export const POST = withAdminDynamic(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    const updated = await cancelCreditNote(id, reason);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error cancelling credit note:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
});
