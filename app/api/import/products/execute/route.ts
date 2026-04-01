/**
 * API Route: /api/import/products/execute
 * POST: Ejecuta la importación de productos (con soporte dry-run)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from '@/lib/utils';

// Process functions
const processFunctions: Record<string, (value: string) => string | number> = {
  capitalize_trim: (v) => v.trim().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
  uppercase_trim: (v) => v.trim().toUpperCase(),
  lowercase_trim: (v) => v.trim().toLowerCase(),
  trim: (v) => v.trim(),
  round_2: (v) => {
    const num = parseFloat(v.replace(',', '.'));
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  },
  round_int: (v) => {
    const num = parseFloat(v.replace(',', '.'));
    return isNaN(num) ? 0 : Math.round(num);
  },
  parse_es_number: (v) => {
    const num = parseFloat(v.replace(/\./g, '').replace(',', '.'));
    return isNaN(num) ? 0 : num;
  },
};

interface ImportOptions {
  skipStockLessThanOne: boolean;
  duplicateAction: 'skip' | 'update' | 'create_with_suffix';
  defaultCategoryName: string;
  dryRun?: boolean; // If true, only validates without saving
}

interface CategoryMapping {
  [key: string]: {
    action: 'create' | 'map';
    targetId?: string;
    newName?: string;
  };
}

interface ImportProduct {
  _rowIndex: number;
  name: string;
  sku?: string;
  barcode?: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  categoryId?: string;
  categoryName: string;
  isDuplicate: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      products,
      categoryMapping,
      importOptions,
    }: {
      products: ImportProduct[];
      categoryMapping: CategoryMapping;
      importOptions: ImportOptions;
    } = body;

    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: 'Missing products data' }, { status: 400 });
    }

    const isDryRun = importOptions.dryRun ?? false;

    // Get existing categories
    const existingCategories = await prisma.category.findMany({
      select: { id: true, name: true },
    });
    const categoryNameToId = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]));
    const createdCategories = new Map<string, string>(); // name -> id

    // Get existing products for duplicate detection
    const existingProducts = await prisma.product.findMany({
      select: { id: true, name: true, sku: true, barcode: true },
    });
    const productNameToId = new Map(existingProducts.map(p => [p.name.toLowerCase(), p.id]));

    const results: Array<{
      row: number;
      status: 'success' | 'error' | 'skipped';
      message: string;
      productId?: string;
      name?: string;
    }> = [];

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);

      for (const product of batch) {
        try {
          // Ensure category exists or create it
          let categoryId = product.categoryId;
          const categoryKey = product.categoryName.toLowerCase();

          if (!categoryId) {
            // Check if we already created this category in this import
            if (createdCategories.has(categoryKey)) {
              categoryId = createdCategories.get(categoryKey)!;
            } else if (categoryNameToId.has(categoryKey)) {
              categoryId = categoryNameToId.get(categoryKey)!;
            } else {
              const mapped = categoryMapping[categoryKey];
              if (mapped?.action === 'map' && mapped.targetId) {
                categoryId = mapped.targetId;
              } else if (mapped?.action === 'create' && mapped.newName) {
                // Create category
                if (!isDryRun) {
                  const newCategory = await prisma.category.create({
                    data: {
                      id: nanoid(),
                      name: mapped.newName,
                      description: `Importado desde CSV`,
                    },
                  });
                  categoryId = newCategory.id;
                  createdCategories.set(categoryKey, categoryId);
                } else {
                  // In dry-run, simulate category creation
                  categoryId = `dry-run-cat-${categoryKey}`;
                }
              } else {
                // Create with default name
                if (!isDryRun) {
                  const newCategory = await prisma.category.create({
                    data: {
                      id: nanoid(),
                      name: processFunctions.capitalize_trim(product.categoryName) as string,
                      description: `Importado desde CSV`,
                    },
                  });
                  categoryId = newCategory.id;
                  createdCategories.set(categoryKey, categoryId);
                } else {
                  categoryId = `dry-run-cat-${categoryKey}`;
                }
              }
            }
          }

          // Check for duplicates by name
          const existingId = productNameToId.get(product.name.toLowerCase());

          if (existingId && importOptions.duplicateAction === 'update' && !isDryRun) {
            // Update existing product
            await prisma.product.update({
              where: { id: existingId },
              data: {
                costPrice: product.costPrice,
                salePrice: product.salePrice,
                stock: product.stock,
                categoryId: categoryId!,
              },
            });
            updated++;
            results.push({
              row: product._rowIndex,
              status: 'success',
              message: 'Producto actualizado',
              productId: existingId,
              name: product.name,
            });
          } else if (existingId && importOptions.duplicateAction === 'skip') {
            skipped++;
            results.push({
              row: product._rowIndex,
              status: 'skipped',
              message: 'Producto duplicado omitido',
              name: product.name,
            });
          } else {
            // Create new product
            if (!isDryRun) {
              const newProduct = await prisma.product.create({
                data: {
                  id: nanoid(),
                  name: product.name,
                  sku: product.sku || null,
                  barcode: product.barcode || null,
                  costPrice: product.costPrice,
                  salePrice: product.salePrice,
                  stock: product.stock,
                  minStock: 0,
                  categoryId: categoryId!,
                  isActive: true,
                },
              });
              created++;
              results.push({
                row: product._rowIndex,
                status: 'success',
                message: 'Producto creado',
                productId: newProduct.id,
                name: product.name,
              });
            } else {
              created++;
              results.push({
                row: product._rowIndex,
                status: 'success',
                message: '[DRY RUN] Producto sería creado',
                productId: `dry-run-${nanoid()}`,
                name: product.name,
              });
            }
          }
        } catch (error) {
          errors++;
          results.push({
            row: product._rowIndex,
            status: 'error',
            message: error instanceof Error ? error.message : 'Error desconocido',
            name: product.name,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      dryRun: isDryRun,
      stats: {
        total: products.length,
        created,
        updated,
        skipped,
        errors,
      },
      results,
    });
  } catch (error) {
    console.error('Error executing import:', error);
    return NextResponse.json(
      { error: 'Error executing import' },
      { status: 500 }
    );
  }
}
