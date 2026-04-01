/**
 * API Route: /api/import/products/validate
 * POST: Valida los datos del CSV sin guardar (dry-run)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

interface ColumnMapping {
  column: string;
  process: string;
  skipEmpty?: boolean;
  defaultValue?: string;
}

interface ImportOptions {
  skipStockLessThanOne: boolean;
  duplicateAction: 'skip' | 'update' | 'create_with_suffix';
  defaultCategoryName: string;
}

interface CategoryMapping {
  [key: string]: {
    action: 'create' | 'map';
    targetId?: string;
    newName?: string;
  };
}

function processValue(value: string, mapping: ColumnMapping): string | number | null {
  if (!value || value.trim() === '') {
    if (mapping.skipEmpty) return null;
    if (mapping.defaultValue) value = mapping.defaultValue;
    else return '';
  }

  const processor = processFunctions[mapping.process];
  if (processor) {
    return processor(value);
  }
  return value.trim();
}

function parseSpanishNumber(value: string): number {
  if (!value) return 0;
  // Handle Spanish format: "1.234,56" or "1234,56"
  const clean = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      csvData,
      mapping,
      categoryMapping,
      importOptions,
    }: {
      csvData: { headers: string[]; rows: string[][] };
      mapping: Record<string, ColumnMapping>;
      categoryMapping: CategoryMapping;
      importOptions: ImportOptions;
    } = body;

    if (!csvData || !mapping || !mapping.name) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Get existing categories for duplicate detection
    const existingCategories = await prisma.category.findMany({
      select: { id: true, name: true },
    });
    const categoryNameToId = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]));

    // Get existing products for duplicate detection
    const existingProducts = await prisma.product.findMany({
      select: { id: true, name: true, sku: true, barcode: true },
    });
    const existingNames = new Set(existingProducts.map(p => p.name.toLowerCase()));
    const existingSkus = new Set(existingProducts.map(p => p.sku?.toLowerCase()).filter(Boolean));
    const existingBarcodes = new Set(existingProducts.map(p => p.barcode?.toLowerCase()).filter(Boolean));

    const valid: unknown[] = [];
    const invalid: Array<{ row: number; reason: string; data: Record<string, unknown> }> = [];
    const categoriesToCreate = new Map<string, { name: string; count: number }>();

    for (let i = 0; i < csvData.rows.length; i++) {
      const row = csvData.rows[i];
      const rowIndex = i + 2;
      const rowData: Record<string, string> = {};
      csvData.headers.forEach((h, idx) => {
        rowData[h] = row[idx] || '';
      });

      // Process name (required)
      const nameMapping = mapping.name;
      const rawName = rowData[nameMapping.column] || '';
      const name = processValue(rawName, nameMapping) as string;

      if (!name || name.trim() === '') {
        invalid.push({
          row: rowIndex,
          reason: 'Nombre vacío',
          data: rowData,
        });
        continue;
      }

      // Check for empty column skip
      let shouldSkip = false;
      for (const [field, fieldMapping] of Object.entries(mapping)) {
        if (fieldMapping.skipEmpty && fieldMapping.column) {
          const value = rowData[fieldMapping.column];
          if (!value || value.trim() === '') {
            invalid.push({
              row: rowIndex,
              reason: `Campo ${field} vacío (omitir si vacío activado)`,
              data: rowData,
            });
            shouldSkip = true;
            break;
          }
        }
      }
      if (shouldSkip) continue;

      // Process stock
      const stockMapping = mapping.stock;
      let stock = 0;
      if (stockMapping?.column) {
        const rawStock = rowData[stockMapping.column] || '0';
        stock = processValue(rawStock, { ...stockMapping, process: 'round_int' }) as number;
      }

      // Skip if stock < 1 and option enabled
      if (importOptions.skipStockLessThanOne && stock < 1) {
        invalid.push({
          row: rowIndex,
          reason: `Stock ${stock} < 1 (omitir stock bajo activado)`,
          data: rowData,
        });
        continue;
      }

      // Process code/sku
      let code: string | undefined;
      if (mapping.code?.column) {
        code = processValue(rowData[mapping.code.column] || '', mapping.code) as string;
      }

      // Process barcode
      let barcode: string | undefined;
      if (mapping.barcode?.column) {
        barcode = processValue(rowData[mapping.barcode.column] || '', mapping.barcode) as string;
      }

      // Check duplicates
      const nameLower = name.toLowerCase();
      const codeLower = code?.toLowerCase();
      const barcodeLower = barcode?.toLowerCase();

      const isDuplicate = existingNames.has(nameLower) ||
        (codeLower && existingSkus.has(codeLower)) ||
        (barcodeLower && existingBarcodes.has(barcodeLower));

      let finalName = name;
      if (isDuplicate) {
        if (importOptions.duplicateAction === 'skip') {
          invalid.push({
            row: rowIndex,
            reason: 'Producto duplicado (omitir)', // Product duplicated (skip)
            data: rowData,
          });
          continue;
        } else if (importOptions.duplicateAction === 'create_with_suffix') {
          let suffix = 2;
          while (existingNames.has(`${nameLower} (${suffix})`)) {
            suffix++;
          }
          finalName = `${name} (${suffix})`;
        }
        // If 'update', we'll handle it in execute
      }

      // Process category
      let categoryId: string | undefined;
      const categoryCol = mapping.categoryId?.column || 'RUBRO';
      const rawCategory = rowData[categoryCol] || '';
      const categoryName = rawCategory.trim() || importOptions.defaultCategoryName;

      if (categoryName) {
        const categoryKey = categoryName.toLowerCase();
        const existingId = categoryNameToId.get(categoryKey);

        if (existingId) {
          categoryId = existingId;
        } else {
          const mapped = categoryMapping[categoryKey];
          if (mapped?.action === 'map' && mapped.targetId) {
            categoryId = mapped.targetId;
          } else {
            // Will create new category
            const newCatName = processFunctions.capitalize_trim(categoryName) as string;
            if (!categoriesToCreate.has(categoryKey)) {
              categoriesToCreate.set(categoryKey, { name: newCatName, count: 0 });
            }
            categoriesToCreate.get(categoryKey)!.count++;
          }
        }
      }

      // Process prices
      let costPrice = 0;
      if (mapping.costPrice?.column) {
        const raw = rowData[mapping.costPrice.column] || '0';
        costPrice = parseSpanishNumber(raw);
      }

      let wholesalePrice = 0;
      if (mapping.wholesalePrice?.column) {
        const raw = rowData[mapping.wholesalePrice.column] || '0';
        wholesalePrice = parseSpanishNumber(raw);
      }

      let retailPrice = 0;
      if (mapping.retailPrice?.column) {
        const raw = rowData[mapping.retailPrice.column] || '0';
        retailPrice = parseSpanishNumber(raw);
      }

      // Use salePrice if available, fallback to retailPrice or costPrice
      let salePrice = retailPrice || wholesalePrice || costPrice;

      // Ensure non-negative prices
      costPrice = Math.max(0, costPrice);
      salePrice = Math.max(0, salePrice);

      // Process unit
      let unit = 'unidad';
      if (mapping.unit?.column) {
        unit = processValue(rowData[mapping.unit.column] || 'unidad', mapping.unit) as string;
      }

      const processedProduct = {
        _rowIndex: rowIndex,
        name: finalName,
        sku: code,
        barcode,
        costPrice,
        salePrice,
        stock,
        unit,
        categoryId,
        categoryName: categoryName || importOptions.defaultCategoryName,
        isDuplicate,
        _sourceData: rowData,
      };

      valid.push(processedProduct);
    }

    const stats = {
      total: csvData.rows.length,
      valid: valid.length,
      invalid: invalid.length,
      categoriesToCreateCount: categoriesToCreate.size,
    };

    return NextResponse.json({
      valid,
      invalid,
      stats,
      categoriesToCreate: Array.from(categoriesToCreate.entries()).map(([key, val]) => ({
        key,
        ...val,
      })),
    });
  } catch (error) {
    console.error('Error validating CSV:', error);
    return NextResponse.json(
      { error: 'Error validating CSV data' },
      { status: 500 }
    );
  }
}
