import { NextRequest, NextResponse } from 'next/server';
import { withPermissionDynamic } from '@/lib/api-middleware';
import { cancelCreditNote } from '@/lib/services/creditNoteService';

export const POST = withPermissionDynamic('can_cancel_credit_notes', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }, _session) => {
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
