import { NextRequest, NextResponse } from 'next/server';
import { getDirectSaleById } from '@/lib/services/directSaleService';
import { toISODate } from '@/lib/utils/date';

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

    // Convert Drizzle raw PG timestamps to ISO 8601 and string decimals to numbers
    const saleSerialized = {
      ...sale,
      total: Number(sale.total),
      createdAt: toISODate(sale.createdAt),
      customer: sale.customer
        ? {
            ...sale.customer,
            balance: Number(sale.customer.balance),
          }
        : sale.customer,
      directSaleItems: sale.directSaleItems.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      directSalePayments: sale.directSalePayments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
        createdAt: toISODate(payment.createdAt),
      })),
    };

    return NextResponse.json(saleSerialized);
  } catch (error) {
    console.error('Error fetching direct sale:', error);
    return NextResponse.json({ error: 'Error al obtener venta' }, { status: 500 });
  }
}
