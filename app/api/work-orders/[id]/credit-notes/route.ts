import { NextRequest, NextResponse } from 'next/server';
import { withAdminDynamic } from '@/lib/api-middleware';
import { getAlreadyReturnedQuantities } from '@/lib/services/creditNoteService';

export const GET = withAdminDynamic(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const returned = await getAlreadyReturnedQuantities(id, 'work_order');
    return NextResponse.json({ returned });
  } catch (error) {
    console.error('Error fetching credit notes for work order:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
});
