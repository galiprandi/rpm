/**
 * API Route: /api/import/products/execute
 * POST: Ejecuta importación con batch processing
 * Recibe payload validado por Zod, crea categorías y productos en batches
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { product, category } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  ImportPayloadSchema,
  ImportResultSchema,
  type ImportPayload,
  type ImportResult,
  type ImportResultItem,
  type ProductWithCategoryInput,
} from '@/lib/product-import-schemas';

// Batch size for processing
const BATCH_SIZE = 100;

// ============================================================================
// Batch Processing
// ============================================================================

interface BatchResult {
  created: number;
  failed: number;
  skipped: number;
  results: ImportResultItem[];
}

async function processBatch(
  products: ProductWithCategoryInput[],
  categoryIdMap: Map<string, string>, // detectedName -> finalCategoryId
  startIndex: number,
  duplicateAction: 'skip' | 'create_with_suffix',
  defaultSupplierId?: string
): Promise<BatchResult> {
  const results: ImportResultItem[] = [];
  let created = 0;
  let failed = 0;
  let skipped = 0;

  // Get existing products for duplicate checking
  const existingProducts = await db
    .select({ id: product.id, name: product.name, sku: product.sku })
    .from(product);
  const existingNames = new Set(existingProducts.map((p) => p.name.toLowerCase()));
  const existingSkus = new Set(existingProducts.map((p) => p.sku?.toLowerCase()).filter(Boolean));

  // Process sequentially within batch for transaction safety
  for (let i = 0; i < products.length; i++) {
    const item = products[i];
    const globalIndex = startIndex + i;

    try {
      // Resolve category ID
      const finalCategoryId = categoryIdMap.get(item.categoryId);
      if (!finalCategoryId) {
        results.push({
          row: globalIndex,
          name: item.name,
          status: 'error',
          message: `Categoría no encontrada: ${item.categoryId}`,
        });
        failed++;
        continue;
      }

      // Check for duplicates
      const isDuplicate = existingNames.has(item.name.toLowerCase()) ||
        (item.sku && existingSkus.has(item.sku.toLowerCase()));

      if (isDuplicate) {
        if (duplicateAction === 'skip') {
          results.push({
            row: globalIndex,
            name: item.name,
            status: 'skipped',
            message: 'Producto duplicado (omitido por configuración)',
          });
          skipped++;
          continue;
        } else if (duplicateAction === 'create_with_suffix') {
          // Add suffix to make unique
          const suffix = 2;
          item.name = `${item.name} (${suffix})`;
          if (item.sku) {
            item.sku = `${item.sku}-${suffix}`;
          }
        }
      }

      // Create product
      const [createdProduct] = await db
        .insert(product)
        .values({
          id: randomUUID(),
          name: item.name,
          sku: item.sku,
          barcode: item.barcode,
          description: item.description,
          costPrice: item.costPrice.toString(),
          replacementCost: item.replacementCost.toString(),
          stock: item.stock,
          minStock: item.minStock,
          location: item.location,
          categoryId: finalCategoryId,
          supplierId: item.supplierId || defaultSupplierId || null,
          isActive: true,
          updatedAt: new Date().toISOString(),
        })
        .returning();

      results.push({
        row: globalIndex,
        name: item.name,
        status: 'success',
        message: isDuplicate ? 'Producto creado con sufijo' : 'Producto creado',
        productId: createdProduct.id,
      });
      created++;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      results.push({
        row: globalIndex,
        name: item.name,
        status: 'error',
        message: `Error: ${message}`,
      });
      failed++;
    }
  }

  return { created, failed, skipped, results };
}

// ============================================================================
// Category Creation
// ============================================================================

async function createCategories(
  categoryMappings: ImportPayload['categoryMappings'],
  existingCategories: Array<{ id: string; name: string }>
): Promise<{
  idMap: Map<string, string>; // detectedName -> categoryId
  created: Array<{ id: string; name: string }>;
}> {
  const idMap = new Map<string, string>();
  const created: Array<{ id: string; name: string }> = [];
  const existingByName = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]));

  for (const mapping of categoryMappings) {
    if (mapping.action === 'map' && mapping.targetId) {
      // Use existing category
      idMap.set(mapping.sourceName, mapping.targetId);
    } else {
      // Create new category
      const existingId = existingByName.get(mapping.newName.toLowerCase());
      if (existingId) {
        // Category already exists (race condition or duplicate)
        idMap.set(mapping.sourceName, existingId);
      } else {
        try {
          const [newCategory] = await db
            .insert(category)
            .values({
              id: randomUUID(),
              name: mapping.newName,
              description: null,
              updatedAt: new Date().toISOString(),
            })
            .returning();
          idMap.set(mapping.sourceName, newCategory.id);
          created.push({ id: newCategory.id, name: newCategory.name });
        } catch {
          // If creation failed, try to find existing
          const existing = await db.query.category.findFirst({
            where: eq(category.name, mapping.newName),
          });
          if (existing) {
            idMap.set(mapping.sourceName, existing.id);
          }
        }
      }
    }
  }

  return { idMap, created };
}

// ============================================================================
// Main Handler
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const POST = withAdmin(async (request: NextRequest, _session) => {
  try {
    const body = await request.json();

    // Validate with Zod
    const parseResult = ImportPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { products, categoryMappings, options } = parseResult.data;

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No hay productos para importar' },
        { status: 400 }
      );
    }

    // Get existing categories
    const existingCategories = await db
      .select({ id: category.id, name: category.name })
      .from(category);

    // Create/resolve categories first
    const { idMap: categoryIdMap, created: createdCategories } = await createCategories(
      categoryMappings,
      existingCategories
    );

    // Filter products based on duplicate action
    const productsToProcess = options.duplicateAction === 'skip'
      ? products // Skip logic already handled in validation
      : products;

    // Process in batches
    const allResults: ImportResultItem[] = [];
    let totalCreated = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    for (let i = 0; i < productsToProcess.length; i += BATCH_SIZE) {
      const batch = productsToProcess.slice(i, i + BATCH_SIZE);
      const batchResult = await processBatch(batch, categoryIdMap, i, options.duplicateAction, options.defaultSupplierId);

      totalCreated += batchResult.created;
      totalFailed += batchResult.failed;
      totalSkipped += batchResult.skipped;
      allResults.push(...batchResult.results);
    }

    // Build result
    const result: ImportResult = {
      stats: {
        attempted: products.length,
        created: totalCreated,
        failed: totalFailed,
        skipped: totalSkipped,
      },
      results: allResults,
      createdCategories,
    };

    // Validate response
    const validatedResult = ImportResultSchema.parse(result);

    return NextResponse.json(validatedResult);

  } catch (error) {
    console.error('Import execution error:', error);
    return NextResponse.json(
      { error: 'Error ejecutando importación' },
      { status: 500 }
    );
  }
});
