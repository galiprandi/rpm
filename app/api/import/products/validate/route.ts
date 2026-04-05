/**
 * API Route: /api/import/products/validate
 * POST: Valida datos CSV contra esquema Zod y detecta duplicados/categorías
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  ProductWithCategorySchema,
  ValidationResultSchema,
  transformValue,
  findBestCategoryMatch,
  type ColumnMapping,
  type ImportOptions,
  type ProductWithCategoryInput,
  type InvalidRow,
  type DetectedCategory,
} from '@/lib/product-import-schemas';

// ============================================================================
// Field Type Mapping
// ============================================================================

const FIELD_TYPES: Record<string, 'string' | 'decimal' | 'integer' | 'category'> = {
  name: 'string',
  sku: 'string',
  barcode: 'string',
  description: 'string',
  costPrice: 'decimal',
  replacementCost: 'decimal',
  stock: 'integer',
  minStock: 'integer',
  location: 'string',
  categoryId: 'category',
};

// ============================================================================
// CSV Row Processing
// ============================================================================

function processRow(
  row: string[],
  headers: string[],
  mapping: Record<string, ColumnMapping>,
  defaultCategoryId?: string
): { product: Partial<ProductWithCategoryInput>; errors: string[] } {
  const product: Partial<ProductWithCategoryInput> = {};
  const errors: string[] = [];

  for (const [fieldKey, fieldMapping] of Object.entries(mapping)) {
    // Skip unmapped fields
    if (!fieldMapping.column || fieldMapping.column === '_none') {
      continue;
    }

    // Find column index
    const colIndex = headers.indexOf(fieldMapping.column);
    if (colIndex === -1) {
      errors.push(`Columna ${fieldMapping.column} no encontrada`);
      continue;
    }

    const rawValue = row[colIndex] || '';

    // Check skipEmpty
    if (fieldMapping.skipEmpty && rawValue.trim() === '') {
      errors.push(`Campo ${fieldKey} está vacío (omitir)`);
      return { product: {}, errors };
    }

    // Transform value based on field type
    const fieldType = FIELD_TYPES[fieldKey];
    if (!fieldType) {
      errors.push(`Tipo desconocido para campo ${fieldKey}`);
      continue;
    }

    const transformed = transformValue(
      rawValue,
      fieldType,
      fieldMapping.transform,
      fieldMapping.defaultValue
    );

    // Assign to product
    if (fieldKey === 'categoryId') {
      // Category is handled separately after initial processing
      (product as Record<string, unknown>)[fieldKey] = transformed;
    } else {
      (product as Record<string, unknown>)[fieldKey] = transformed;
    }
  }

  // Apply default category if none mapped
  if (!product.categoryId && defaultCategoryId) {
    product.categoryId = defaultCategoryId;
  }

  return { product, errors };
}

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received validation request:', JSON.stringify(body, null, 2));
    
    const {
      csvData,
      mapping,
      importOptions,
    }: {
      csvData: { headers: string[]; rows: string[][] };
      mapping: Record<string, ColumnMapping>;
      importOptions: ImportOptions;
    } = body;

    // Validate input
    if (!csvData?.rows?.length) {
      console.error('No CSV data rows found');
      return NextResponse.json({ error: 'No hay datos CSV' }, { status: 400 });
    }

    if (!mapping?.name?.column) {
      console.error('No name column mapped:', mapping);
      return NextResponse.json({ error: 'El campo nombre es requerido' }, { status: 400 });
    }

    // Load existing data for duplicate/category detection
    const [existingCategories, existingProducts] = await Promise.all([
      prisma.category.findMany({ select: { id: true, name: true } }),
      prisma.product.findMany({
        select: { id: true, name: true, sku: true, barcode: true },
      }),
    ]);

    const existingNames = new Set(existingProducts.map(p => p.name.toLowerCase()));
    const existingSkus = new Set(existingProducts.map(p => p.sku?.toLowerCase()).filter(Boolean));

    // Process rows
    const validProducts: ProductWithCategoryInput[] = [];
    const invalidRows: InvalidRow[] = [];
    const detectedCategories = new Map<string, { count: number; normalizedName: string }>();

    for (let rowIndex = 0; rowIndex < csvData.rows.length; rowIndex++) {
      const row = csvData.rows[rowIndex];

      // Process row
      const { product, errors } = processRow(
        row,
        csvData.headers,
        mapping,
        importOptions.defaultCategoryId
      );

      if (errors.length > 0) {
        invalidRows.push({
          rowIndex,
          reason: errors.join('; '),
          rawData: Object.fromEntries(
            csvData.headers.map((h, i) => [h, row[i] || ''])
          ),
          transformedData: product, // Incluir valores transformados
          errors,
        });
        continue;
      }

      // Validate with Zod
      const parseResult = ProductWithCategorySchema.safeParse(product);
      if (!parseResult.success) {
        const zodErrors = parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`);
        invalidRows.push({
          rowIndex,
          reason: zodErrors.join('; '),
          rawData: Object.fromEntries(
            csvData.headers.map((h, i) => [h, row[i] || ''])
          ),
          transformedData: product, // Incluir valores transformados
          errors: zodErrors,
        });
        continue;
      }

      const validatedProduct = parseResult.data;

      // Check stock filter
      if (importOptions.skipStockLessThanOne && validatedProduct.stock < 1) {
        invalidRows.push({
          rowIndex,
          reason: 'Stock menor a 1',
          rawData: Object.fromEntries(
            csvData.headers.map((h, i) => [h, row[i] || ''])
          ),
          transformedData: product, // Incluir valores transformados
        });
        continue;
      }

      // Check duplicates and handle based on action
      const isDuplicate = existingNames.has(validatedProduct.name.toLowerCase()) ||
        (validatedProduct.sku && existingSkus.has(validatedProduct.sku.toLowerCase()));

      // Skip duplicates if action is 'skip'
      if (isDuplicate && importOptions.duplicateAction === 'skip') {
        invalidRows.push({
          rowIndex,
          reason: 'Producto duplicado (omitido por configuración)',
          rawData: Object.fromEntries(
            csvData.headers.map((h, i) => [h, row[i] || ''])
          ),
          transformedData: product, // Incluir valores transformados
        });
        continue;
      }

      // Track category
      if (validatedProduct.categoryId) {
        const catKey = validatedProduct.categoryId.toLowerCase();
        const existing = detectedCategories.get(catKey);
        if (existing) {
          existing.count++;
        } else {
          detectedCategories.set(catKey, {
            count: 1,
            normalizedName: validatedProduct.categoryId,
          });
        }
      }

      // Add to results
      validProducts.push(validatedProduct);
    }

    // Build category mappings
    const categories: DetectedCategory[] = Array.from(detectedCategories.entries()).map(
      ([, data]) => {
        // Check for fuzzy match with existing
        const match = findBestCategoryMatch(data.normalizedName, existingCategories);

        return {
          detectedName: data.normalizedName,
          normalizedName: data.normalizedName,
          count: data.count,
          action: match ? 'map' : 'create',
          targetCategoryId: match?.id,
          finalName: match?.name || data.normalizedName,
        };
      }
    );

    const result = {
      valid: validProducts,
      invalid: invalidRows,
      categories,
      stats: {
        total: csvData.rows.length,
        valid: validProducts.length,
        invalid: invalidRows.length,
        categoriesToCreate: categories.filter(c => c.action === 'create').length,
      },
    };

    // Validate response with Zod
    const validatedResult = ValidationResultSchema.parse(result);

    return NextResponse.json(validatedResult);

  } catch (error) {
    console.error('Validation error:', error);
    
    // If it's a Zod error, provide more details
    if (error instanceof Error && error.message.includes('Zod')) {
      return NextResponse.json(
        { error: 'Error de validación de esquema', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error validando datos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
