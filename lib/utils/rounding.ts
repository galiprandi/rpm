/**
 * Rounding Helper - Utility functions for price rounding strategies
 *
 * Supports multiple rounding rules for dynamic price calculation:
 * - EXACT: No rounding
 * - NEAREST_INTEGER: Standard rounding to nearest integer
 * - PSYCHOLOGICAL: Prices ending in .90 or .99
 * - SMART_HUNDREDS: Intelligent rounding to tens/hundreds
 */

export type RoundingRule = 'EXACT' | 'NEAREST_INTEGER' | 'PSYCHOLOGICAL' | 'SMART_HUNDREDS';

export interface PriceException {
  overrideMarginPercentage?: number;
  fixedPrice?: number;
}

/**
 * Apply rounding strategy to a price value
 */
export function applyRounding(value: number, rule: RoundingRule): number {
  switch (rule) {
    case 'EXACT':
      return roundToDecimals(value, 2);

    case 'NEAREST_INTEGER':
      return Math.round(value);

    case 'PSYCHOLOGICAL':
      return applyPsychologicalRounding(value);

    case 'SMART_HUNDREDS':
      return applySmartRounding(value);

    default:
      return roundToDecimals(value, 2);
  }
}

/**
 * Calculate final price based on replacement cost, margin, and rounding rules
 */
export function calculateFinalPrice(
  replacementCost: number,
  baseMargin: number,
  roundingRule: RoundingRule,
  itemException?: PriceException
): number {
  // If fixed price is set in exception, use it directly (no rounding)
  if (itemException?.fixedPrice !== undefined) {
    return roundToDecimals(itemException.fixedPrice, 2);
  }

  // Determine margin to apply (exception override or base margin)
  const marginToApply = itemException?.overrideMarginPercentage ?? baseMargin;

  // Calculate raw price with margin
  const rawPrice = replacementCost * (1 + marginToApply / 100);

  // Apply rounding rule
  return applyRounding(rawPrice, roundingRule);
}

/**
 * Calculate margin percentage from cost and final price
 */
export function calculateMarginPercentage(cost: number, finalPrice: number): number {
  if (cost <= 0) return 0;
  return ((finalPrice - cost) / cost) * 100;
}

/**
 * Round to specified decimal places
 */
function roundToDecimals(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Apply psychological pricing (ends in .90 or .99)
 * - Values < 100: ends in .90
 * - Values >= 100: ends in .99
 */
function applyPsychologicalRounding(value: number): number {
  const integerPart = Math.floor(value);

  if (integerPart < 100) {
    // For smaller values, end in .90
    return integerPart + 0.90;
  } else {
    // For larger values, end in .99
    return integerPart + 0.99;
  }
}

/**
 * Apply smart rounding to tens/hundreds
 * - Values < 1000: round to nearest 10
 * - Values >= 1000: round to nearest 10 (keeping tens precision)
 * This keeps prices commercially attractive while maintaining precision
 */
function applySmartRounding(value: number): number {
  // Always round to nearest 10 for commercial pricing
  return Math.round(value / 10) * 10;
}

/**
 * Check if a margin is below the minimum required
 */
export function isMarginBelowMinimum(margin: number, minimumMargin: number): boolean {
  return margin < minimumMargin;
}

/**
 * Format price as currency string
 */
export function formatPrice(price: number, currency: string = '$'): string {
  return `${currency} ${price.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
