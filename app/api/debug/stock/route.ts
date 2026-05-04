import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const productName = searchParams.get('productName');

    let products;
    if (productId) {
      products = await prisma.product.findMany({
        where: { id: productId },
        select: { id: true, name: true, stock: true, sku: true },
      });
    } else if (productName) {
      products = await prisma.product.findMany({
        where: { name: { contains: productName, mode: 'insensitive' } },
        select: { id: true, name: true, stock: true, sku: true },
      });
    } else {
      products = await prisma.product.findMany({
        select: { id: true, name: true, stock: true, sku: true },
        take: 10,
      });
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json({ error: 'Error fetching stock' }, { status: 500 });
  }
});
