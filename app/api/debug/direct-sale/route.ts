import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get('saleId');

    if (!saleId) {
      return NextResponse.json({ error: 'saleId is required' }, { status: 400 });
    }

    const sale = await prisma.direct_sale.findUnique({
      where: { id: saleId },
      include: {
        items: true,
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json({ sale });
  } catch (error) {
    console.error('Error fetching direct sale:', error);
    return NextResponse.json({ error: 'Error fetching direct sale' }, { status: 500 });
  }
});
