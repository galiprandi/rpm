/**
 * CSV Value Transformers
 * Reusable functions for transforming CSV values with proper error handling
 */

export type TransformerFunction = (value: string) => string;

/**
 * Capitalizes each word and trims the value
 * Example: "hello world" → "Hello World"
 */
export const capitalizeTrim: TransformerFunction = (value) => {
  return value
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .trim();
};

/**
 * Converts to uppercase and trims
 * Example: "abc" → "ABC"
 */
export const uppercaseTrim: TransformerFunction = (value) => {
  return value.toUpperCase().trim();
};

/**
 * Converts to lowercase and trims
 * Example: "ABC" → "abc"
 */
export const lowercaseTrim: TransformerFunction = (value) => {
  return value.toLowerCase().trim();
};

/**
 * Just trims whitespace
 */
export const trimOnly: TransformerFunction = (value) => {
  return value.trim();
};

/**
 * Parses Spanish number format (comma as decimal separator)
 * Handles quoted values and thousand separators
 * Examples:
 *   "52219,49" → "52219.49"
 *   "1.234,56" → "1234.56"
 *   "1234" → "1234"
 */
export const parseEsNumber: TransformerFunction = (value) => {
  if (!value) return value;
  
  // Remove quotes, handle thousand separators, convert comma to dot
  return value
    .replace(/^["']|["']$/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
};

/**
 * Resilient decimal parser - handles multiple formats
 * Examples:
 *   "52219,49" → "52219.49"
 *   "52.219,49" → "52219.49"
 *   "52219.49" → "52219.49"
 *   "52,219.49" → "52219.49"
 */
export const resilientDecimal: TransformerFunction = (value) => {
  if (!value) return value;
  
  // Remove quotes
  let cleaned = value.replace(/^["']|["']$/g, '');
  
  // Detect format and convert
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  
  if (hasComma && hasDot) {
    // Both present - determine which is decimal separator
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Comma is decimal separator (Spanish format: 1.234,56)
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Dot is decimal separator (English format with thousand sep: 1,234.56)
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Only comma - assume it's decimal separator
    cleaned = cleaned.replace(',', '.');
  }
  // If only dot or neither, return as-is (already uses dot)
  
  return cleaned;
};

/**
 * Resilient integer parser - extracts integer value
 * Removes all separators and returns only digits
 * Examples:
 *   "1.234" → "1234"
 *   "1,234" → "1234"
 *   "1234" → "1234"
 *   "1234.56" → "1234"
 */
export const resilientInteger: TransformerFunction = (value) => {
  if (!value) return value;
  
  return value
    .replace(/^["']|["']$/g, '')
    .replace(/[.,]/g, '')
    .split('.')[0];
};

/**
 * Rounds to 2 decimal places
 */
export const roundTo2: TransformerFunction = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toFixed(2);
};

/**
 * Rounds to integer
 */
export const roundToInt: TransformerFunction = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return Math.round(num).toString();
};

/**
 * Registry of all available transformers
 */
export const TRANSFORMERS: Record<string, TransformerFunction> = {
  capitalize_trim: capitalizeTrim,
  uppercase_trim: uppercaseTrim,
  lowercase_trim: lowercaseTrim,
  trim: trimOnly,
  parse_es_number: parseEsNumber,
  resilient_decimal: resilientDecimal,
  resilient_integer: resilientInteger,
  round_2: roundTo2,
  round_int: roundToInt,
};

/**
 * Labels for UI display
 */
export const TRANSFORMER_LABELS: Record<string, string> = {
  capitalize_trim: 'Capitalizar + Trim',
  uppercase_trim: 'Mayúsculas + Trim',
  lowercase_trim: 'Minúsculas + Trim',
  trim: 'Solo Trim',
  parse_es_number: 'Número Español (coma decimal)',
  resilient_decimal: 'Número c/decimal (auto)',
  resilient_integer: 'Número entero (auto)',
  round_2: 'Redondear 2 decimales',
  round_int: 'Redondear Entero',
};

/**
 * Apply a transformer or chain of transformers with fallback
 * Returns original value if transformation fails
 * Can accept single transformer name or array of transformers to chain
 */
export function applyTransformer(
  value: string,
  transformerName: string | string[],
  fallback: boolean = true
): string {
  // Handle array of transformers (chain)
  const transformers = Array.isArray(transformerName) ? transformerName : [transformerName];
  
  if (!value || value.trim() === '') {
    return value;
  }
  
  let currentValue = value;
  
  for (const name of transformers) {
    const transformer = TRANSFORMERS[name];
    
    if (!transformer) {
      console.warn(`Transformer "${name}" not found`);
      continue;
    }
    
    try {
      currentValue = transformer(currentValue);
    } catch (error) {
      console.error(`Transformer "${name}" failed for value "${currentValue}":`, error);
      if (!fallback) return '';
      // On error, continue with current value (don't break chain)
    }
  }
  
  return currentValue;
}
