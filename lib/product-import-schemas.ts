/**
 * Product Import Schemas
 * Shared between UI and API for type-safe validation
 * Used with Zod for runtime validation that matches Prisma schema
 */

import { z } from 'zod';

// ============================================================================
// Enums y Tipos Base
// ============================================================================

export const DuplicateActionEnum = z.enum(['skip', 'create_with_suffix']);
export type DuplicateActionType = z.infer<typeof DuplicateActionEnum>;

export const StringTransformEnum = z.enum(['capitalize', 'uppercase', 'lowercase', 'trim']);
export type StringTransformType = z.infer<typeof StringTransformEnum>;

export const DecimalFormatEnum = z.enum(['spanish', 'english']);
export type DecimalFormatType = z.infer<typeof DecimalFormatEnum>;

export const CategoryActionEnum = z.enum(['create', 'map']);
export type CategoryActionType = z.infer<typeof CategoryActionEnum>;

// ============================================================================
// Schemas de Mapeo (UI → API)
// ============================================================================

export const ColumnMappingSchema = z.object({
  column: z.string(), // Nombre de columna CSV
  transform: z.string(), // Tipo de transformación
  defaultValue: z.string().optional(),
  skipEmpty: z.boolean().default(false),
});

export type ColumnMapping = z.infer<typeof ColumnMappingSchema>;

export interface ImportOptions {
  skipStockLessThanOne: boolean;
  duplicateAction: DuplicateActionType;
  defaultCategoryId?: string;
  defaultSupplierId?: string;
}

export const ImportOptionsSchema = z.object({
  skipStockLessThanOne: z.boolean().default(false),
  duplicateAction: DuplicateActionEnum.default('skip'),
  defaultCategoryId: z.string().optional(), // ID de categoría existente
  defaultSupplierId: z.string().optional(), // ID de proveedor existente
});

// ============================================================================
// Schema de Producto (Compatible con Prisma ProductCreateInput)
// ============================================================================

/**
 * Schema para crear producto - valida 100% contra modelo Prisma
 * Omite campos auto-generados: id, createdAt, updatedAt, lastMovementAt
 */
export const ProductCreateSchema = z.object({
  sku: z.string().trim().optional().nullable(),
  name: z.string().trim().min(1, 'El nombre del producto es requerido'),
  description: z.string().trim().optional().nullable(),
  costPrice: z.number().min(0, 'El precio de costo no puede ser negativo'),
  replacementCost: z.number().min(0, 'El costo de reposición no puede ser negativo').optional().default(0),
  stock: z.number().int().min(0, 'El stock no puede ser negativo').default(0),
  minStock: z.number().int().min(0).default(0),
  barcode: z.string().trim().optional().nullable(),
  location: z.string().trim().optional().nullable(),
  isActive: z.boolean().default(true),
  // categoryId se asigna después de procesar categorías
});

export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;

/**
 * Schema extendido con categoryId (usado después de resolver categorías)
 */
export const ProductWithCategorySchema = ProductCreateSchema.extend({
  categoryId: z.string().min(1, 'La categoría es requerida'),
});

export type ProductWithCategoryInput = z.infer<typeof ProductWithCategorySchema>;

// ============================================================================
// Schemas de Categoría
// ============================================================================

/**
 * Categoría detectada en el CSV con opciones de mapeo
 */
export const DetectedCategorySchema = z.object({
  detectedName: z.string(), // Nombre original detectado en CSV
  normalizedName: z.string(), // Nombre después de transformación (capitalizado)
  count: z.number().int().positive(), // Cantidad de productos
  action: CategoryActionEnum.default('create'),
  targetCategoryId: z.string().optional(), // Si action = 'map', ID de categoría existente
  finalName: z.string(), // Nombre final después de renombrar
});

export type DetectedCategory = z.infer<typeof DetectedCategorySchema>;

/**
 * Mapeo de categorías para enviar a API
 */
export interface CategoryMapping {
  sourceName: string;
  action: CategoryActionType;
  targetId?: string;
  newName: string;
  productCount: number;
}

export const CategoryMappingSchema = z.object({
  sourceName: z.string(), // Nombre detectado en CSV
  action: CategoryActionEnum,
  targetId: z.string().optional(), // ID de categoría existente si action = 'map'
  newName: z.string(), // Nombre final para crear/renombrar
  productCount: z.number().int(),
});

// ============================================================================
// Schemas de Validación (API Response)
// ============================================================================

export const InvalidRowSchema = z.object({
  rowIndex: z.number().int(),
  reason: z.string(),
  rawData: z.record(z.string(), z.unknown()),
  transformedData: z.record(z.string(), z.unknown()).optional(), // Valores transformados
  errors: z.array(z.string()).optional(), // Errores de validación Zod
});

export type InvalidRow = z.infer<typeof InvalidRowSchema>;

export const ValidationResultSchema = z.object({
  valid: z.array(ProductWithCategorySchema),
  invalid: z.array(InvalidRowSchema),
  categories: z.array(DetectedCategorySchema),
  stats: z.object({
    total: z.number().int(),
    valid: z.number().int(),
    invalid: z.number().int(),
    categoriesToCreate: z.number().int(),
  }),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// ============================================================================
// Schema de Payload de Importación (Paso Final)
// ============================================================================

/**
 * Payload completo para ejecutar importación
 * Enviado desde UI a API /api/import/products/execute
 */
export const ImportPayloadSchema = z.object({
  products: z.array(ProductWithCategorySchema).min(1, 'Se requiere al menos un producto'),
  categoryMappings: z.array(CategoryMappingSchema),
  options: ImportOptionsSchema,
});

export type ImportPayload = z.infer<typeof ImportPayloadSchema>;

// ============================================================================
// Schemas de CSV (Input Inicial)
// ============================================================================

export const CSVDataSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  totalRows: z.number().int().nonnegative(),
  skippedRows: z.number().int().nonnegative().default(0),
});

export type CSVData = z.infer<typeof CSVDataSchema>;

export const AnalyzeResultSchema = z.object({
  columns: z.array(z.string()),
  preview: z.array(z.record(z.string(), z.unknown())),
  totalRows: z.number().int(),
  skippedRows: z.number().int(),
  delimiter: z.string(),
  encoding: z.string(),
});

export type AnalyzeResult = z.infer<typeof AnalyzeResultSchema>;

// ============================================================================
// Schemas de Resultado de Importación
// ============================================================================

export const ImportResultItemSchema = z.object({
  row: z.number().int(),
  name: z.string(),
  status: z.enum(['success', 'error', 'skipped']),
  message: z.string(),
  productId: z.string().optional(),
});

export type ImportResultItem = z.infer<typeof ImportResultItemSchema>;

export const ImportResultSchema = z.object({
  stats: z.object({
    attempted: z.number().int(),
    created: z.number().int(),
    failed: z.number().int(),
    skipped: z.number().int(),
  }),
  results: z.array(ImportResultItemSchema),
  createdCategories: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
});

export type ImportResult = z.infer<typeof ImportResultSchema>;

// ============================================================================
// Helpers de Validación
// ============================================================================

/**
 * Valida un array de productos y retorna resultado tipado
 */
export function validateProducts(data: unknown[]): { 
  valid: ProductWithCategoryInput[]; 
  invalid: Array<{ index: number; errors: string[] }> 
} {
  const valid: ProductWithCategoryInput[] = [];
  const invalid: Array<{ index: number; errors: string[] }> = [];

  data.forEach((item, index) => {
    const result = ProductWithCategorySchema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({
        index,
        errors: result.error.issues.map((issue: z.ZodIssue) => issue.message),
      });
    }
  });

  return { valid, invalid };
}

/**
 * Formatea errores de Zod para mostrar al usuario
 */
export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
}

// ============================================================================
// Helper Functions (Shared between UI and API)
// ============================================================================

export type FieldType = 'string' | 'decimal' | 'integer' | 'category';
export type StringTransform = 'capitalize' | 'uppercase' | 'lowercase' | 'trim';
export type DecimalTransform = 'spanish' | 'english';

/**
 * Get empty/default value for a field type
 */
export function getEmptyValue(fieldType: FieldType): unknown {
  switch (fieldType) {
    case 'string':
    case 'category':
      return '';
    case 'decimal':
    case 'integer':
      return 0;
    default:
      return null;
  }
}

/**
 * Transform string values (always includes trim)
 */
export function transformString(value: string, transform: StringTransform): string {
  const trimmed = value.trim();

  switch (transform) {
    case 'uppercase':
      return trimmed.toUpperCase();
    case 'lowercase':
      return trimmed.toLowerCase();
    case 'capitalize':
      return trimmed.replace(/\w\S*/g, (w) =>
        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      );
    case 'trim':
    default:
      return trimmed;
  }
}

/**
 * Transform decimal values
 * Handles both Spanish (1.234,56) and English (1,234.56) formats
 */
export function transformDecimal(value: string, format: DecimalTransform): number {
  const cleaned = value.trim().replace(/^["']|["']$/g, '');

  if (format === 'spanish') {
    // Spanish: 1.234,56 → 1234.56
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : Math.max(0, num);
  } else {
    // English: 1,234.56 → 1234.56
    const normalized = cleaned.replace(/,/g, '');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : Math.max(0, num);
  }
}

/**
 * Transform integer values
 */
export function transformInteger(value: string): number {
  const cleaned = value.trim().replace(/[.,]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Transform category names
 */
export function transformCategory(value: string): string {
  return transformString(value, 'capitalize');
}

/**
 * Transform a value based on its field type and transform option
 */
export function transformValue(
  value: string,
  fieldType: FieldType,
  transform: string,
  defaultValue?: string
): unknown {
  // Use default value if empty
  if (!value || value.trim() === '') {
    if (defaultValue) {
      // Recursively transform the default value
      return transformValue(defaultValue, fieldType, transform);
    }
    return getEmptyValue(fieldType);
  }

  switch (fieldType) {
    case 'string':
      return transformString(value, transform as StringTransform);
    case 'decimal':
      return transformDecimal(value, transform as DecimalTransform);
    case 'integer':
      return transformInteger(value);
    case 'category':
      return transformCategory(value);
    default:
      return value.trim();
  }
}

/**
 * Calculate string similarity (0-1 scale) using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len = Math.max(str1.length, str2.length);
  if (len === 0) return 1;

  const distance = levenshteinDistance(str1, str2);
  return (len - distance) / len;
}

/**
 * Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Find best matching category using fuzzy search
 */
export function findBestCategoryMatch(
  name: string,
  existingCategories: Array<{ id: string; name: string }>
): { id: string; name: string } | null {
  const normalizedName = name.toLowerCase().trim();

  // Exact match first
  const exactMatch = existingCategories.find(
    (c) => c.name.toLowerCase() === normalizedName
  );
  if (exactMatch) return exactMatch;

  // Contains match
  const containsMatch = existingCategories.find(
    (c) =>
      c.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(c.name.toLowerCase())
  );
  if (containsMatch) return containsMatch;

  // Levenshtein distance for fuzzy match (threshold: 80% similarity)
  let bestMatch: { id: string; name: string } | null = null;
  let bestScore = 0;

  for (const cat of existingCategories) {
    const score = calculateSimilarity(normalizedName, cat.name.toLowerCase());
    if (score > bestScore && score >= 0.8) {
      bestScore = score;
      bestMatch = cat;
    }
  }

  return bestMatch;
}
