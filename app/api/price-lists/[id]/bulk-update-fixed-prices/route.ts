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
import { db } from '@/lib/db';
import { priceList, priceListItem, product } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
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
    const priceListRecord = await db.query.priceList.findFirst({
      where: eq(priceList.id, priceListId),
    });

    if (!priceListRecord) {
      return NextResponse.json(
        { error: 'Price list not found' },
        { status: 404 }
      );
    }

    // Extract SKUs from updates
    const skus = updates.map(u => u.sku);

    // Find products by SKU
    const products = await db.query.product.findMany({
      where: inArray(product.sku, skus),
      columns: { id: true, sku: true, name: true },
    });

    // Create SKU -> product map
    const productMap = new Map(products.map((p) => [p.sku, p]));

    // Track results
    const updated: BulkUpdateResponse['updated'] = [];
    const ignored: BulkUpdateResponse['ignored'] = [];

    // Process each update
    for (const update of updates) {
      const productRecord = productMap.get(update.sku);

      if (!productRecord) {
        // Product not found in DB - ignore
        ignored.push({ sku: update.sku, reason: 'Product not found in database' });
        continue;
      }

      // Upsert price_list_item
      const [upserted] = await db.insert(priceListItem)
        .values({
          id: randomUUID(),
          priceListId,
          productId: productRecord.id,
          fixedPrice: String(update.fixedPrice),
          overrideMarginPercentage: null,
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: [priceListItem.priceListId, priceListItem.productId],
          set: {
            fixedPrice: String(update.fixedPrice),
            updatedAt: new Date().toISOString(),
          },
        })
        .returning();

      updated.push({
        sku: productRecord.sku,
        productId: productRecord.id,
        fixedPrice: Number(upserted.fixedPrice),
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
