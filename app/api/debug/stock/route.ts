import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { product } from '@/db/schema';
import { eq, ilike, asc } from 'drizzle-orm';

export const GET = withAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const productName = searchParams.get('productName');

    let products;
    if (productId) {
      products = await db
        .select({ id: product.id, name: product.name, stock: product.stock, sku: product.sku })
        .from(product)
        .where(eq(product.id, productId));
    } else if (productName) {
      products = await db
        .select({ id: product.id, name: product.name, stock: product.stock, sku: product.sku })
        .from(product)
        .where(ilike(product.name, `%${productName}%`));
    } else {
      products = await db
        .select({ id: product.id, name: product.name, stock: product.stock, sku: product.sku })
        .from(product)
        .orderBy(asc(product.name))
        .limit(10);
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json({ error: 'Error fetching stock' }, { status: 500 });
  }
});
