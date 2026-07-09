import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithAuth } from '@/lib/api-middleware';
import { generateDocumentFromDirectSale } from '@/lib/services/directSaleService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionWithAuth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { type } = body;

    if (!type || !['PRESUPUESTO', 'REMITO', 'INVOICE'].includes(type)) {
      return NextResponse.json({ error: 'Tipo de documento inválido' }, { status: 400 });
    }

    const document = await generateDocumentFromDirectSale(id, type, session.user.id);

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/direct-sales/[id]/documents:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar el documento' },
      { status: 500 }
    );
  }
}
