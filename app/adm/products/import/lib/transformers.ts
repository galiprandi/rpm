/**
 * CSV Value Transformers (Refactored)
 * Simplified transformations by field type
 * All string transforms include automatic trim
 */

export type FieldType = 'string' | 'decimal' | 'integer' | 'category';
export type StringTransform = 'capitalize' | 'uppercase' | 'lowercase' | 'trim';
export type DecimalTransform = 'spanish' | 'english';
export type IntegerTransform = 'round';
export type CategoryTransform = 'capitalize';

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
    if (defaultValue) return transformValue(defaultValue, fieldType, transform);
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
 * Get empty/default value for a field type
 */
function getEmptyValue(fieldType: FieldType): unknown {
  switch (fieldType) {
    case 'string':
    case 'category':
      return '';
    case 'decimal':
      return 0;
    case 'integer':
      return 0;
    default:
      return null;
  }
}

/**
 * Transform string values (always includes trim)
 */
function transformString(value: string, transform: StringTransform): string {
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
 * Returns number (will be converted to numeric by schema)
 */
function transformDecimal(value: string, format: DecimalTransform): number {
  const cleaned = value.trim().replace(/^["']|["']$/g, '');

  if (format === 'spanish') {
    // Spanish: 1.234,56 → 1234.56
    // Remove thousand separators (dots), convert comma to dot
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : Math.max(0, num);
  } else {
    // English: 1,234.56 → 1234.56
    // Remove thousand separators (commas)
    const normalized = cleaned.replace(/,/g, '');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : Math.max(0, num);
  }
}

/**
 * Transform integer values
 */
function transformInteger(value: string): number {
  const cleaned = value.trim().replace(/[.,]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Transform category names
 */
function transformCategory(value: string): string {
  return transformString(value, 'capitalize');
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

/**
 * Calculate string similarity (0-1 scale)
 * Uses Levenshtein distance algorithm
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

// ============================================================================
// Legacy exports (for backward compatibility during migration)
// ============================================================================

export const capitalizeTrim = (value: string) => transformString(value, 'capitalize');
export const uppercaseTrim = (value: string) => transformString(value, 'uppercase');
export const lowercaseTrim = (value: string) => transformString(value, 'lowercase');
export const trimOnly = (value: string) => transformString(value, 'trim');
