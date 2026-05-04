import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: Record<string, unknown> = {};
    if (productId) where.productId = productId;

    const movements = await prisma.stock_movement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ movements, count: movements.length });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json({ error: 'Error fetching stock movements' }, { status: 500 });
  }
});
