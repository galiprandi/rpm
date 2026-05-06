import { NextRequest, NextResponse } from 'next/server';
import { getDirectSaleById } from '@/lib/services/directSaleService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sale = await getDirectSaleById(id);

    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error fetching direct sale:', error);
    return NextResponse.json({ error: 'Error al obtener venta' }, { status: 500 });
  }
}
