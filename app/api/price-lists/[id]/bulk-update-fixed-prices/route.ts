/**
 * API Route: /api/price-lists/[id]/bulk-update-fixed-prices
 * Method: POST
 * Body: { updates: [{ sku: string, fixedPrice: number }] }
 * 
 * Actualiza en masa los precios fijos de productos en una lista de precios.
 * Ignora productos que no existen en la DB.
 * Requiere rol ADMIN.
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAdminDynamic } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

interface Params {
  params: Promise<{ id: string }>;
}

interface PriceUpdate {
  sku: string;
  fixedPrice: number;
}

interface BulkUpdateRequest {
  updates: PriceUpdate[];
}

interface BulkUpdateResponse {
  updated: Array<{ sku: string | null; productId: string; fixedPrice: number }>;
  ignored: Array<{ sku: string; reason: string }>;
  total: number;
  updatedCount: number;
  ignoredCount: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const POST = withAdminDynamic(async (request: NextRequest, { params }: Params, _session) => {
  try {
    const { id: priceListId } = await params;
    const body: BulkUpdateRequest = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array is required' },
        { status: 400 }
      );
    }

    // Validate price list exists
    const priceList = await prisma.price_list.findUnique({
      where: { id: priceListId },
    });

    if (!priceList) {
      return NextResponse.json(
        { error: 'Price list not found' },
        { status: 404 }
      );
    }

    // Extract SKUs from updates
    const skus = updates.map(u => u.sku);

    // Find products by SKU
    const products = await prisma.product.findMany({
      where: { sku: { in: skus } },
      select: { id: true, sku: true, name: true },
    });

    // Create SKU -> product map
    const productMap = new Map(products.map((p: any) => [p.sku, p]));

    // Track results
    const updated: BulkUpdateResponse['updated'] = [];
    const ignored: BulkUpdateResponse['ignored'] = [];

    // Process each update
    for (const update of updates) {
      const product = productMap.get(update.sku);

      if (!product) {
        // Product not found in DB - ignore
        ignored.push({ sku: update.sku, reason: 'Product not found in database' });
        continue;
      }

      // Upsert price_list_item
      const priceListItem = await prisma.price_list_item.upsert({
        where: {
          priceListId_productId: {
            priceListId,
            productId: product.id,
          },
        },
        update: {
          fixedPrice: update.fixedPrice,
          updatedAt: new Date(),
        },
        create: {
          id: randomUUID(),
          priceListId,
          productId: product.id,
          fixedPrice: update.fixedPrice,
          overrideMarginPercentage: null,
          updatedAt: new Date(),
        },
      });

      updated.push({
        sku: product.sku,
        productId: product.id,
        fixedPrice: Number(priceListItem.fixedPrice),
      });
    }

    const response: BulkUpdateResponse = {
      updated,
      ignored,
      total: updates.length,
      updatedCount: updated.length,
      ignoredCount: ignored.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error bulk updating fixed prices:', error);
    return NextResponse.json(
      { error: 'Error updating prices' },
      { status: 500 }
    );
  }
});
