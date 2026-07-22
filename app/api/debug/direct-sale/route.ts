import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { directSale } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const GET = withAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get('saleId');

    if (!saleId) {
      return NextResponse.json({ error: 'saleId is required' }, { status: 400 });
    }

    const sale = await db.query.directSale.findFirst({
      where: eq(directSale.id, saleId),
      with: {
        directSaleItems: true,
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
