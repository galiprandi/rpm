import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { stockMovement } from '@/db/schema';
import { eq, desc, and, type SQL } from 'drizzle-orm';

export const GET = withAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '10');

    const conditions: SQL[] = [];
    if (productId) conditions.push(eq(stockMovement.productId, productId));

    const movements = await db.query.stockMovement.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: desc(stockMovement.createdAt),
      limit,
    });

    return NextResponse.json({ movements, count: movements.length });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json({ error: 'Error fetching stock movements' }, { status: 500 });
  }
});
