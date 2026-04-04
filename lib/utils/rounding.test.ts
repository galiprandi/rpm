/**
 * Rounding Helper Tests - Unit tests for price rounding strategies
 *
 * Coverage:
 * - All rounding rules (EXACT, NEAREST_INTEGER, PSYCHOLOGICAL, SMART_HUNDREDS)
 * - calculateFinalPrice with various scenarios
 * - Edge cases (decimals, large numbers, zero values)
 */

import { describe, it, expect } from 'vitest';
import {
  applyRounding,
  calculateFinalPrice,
  calculateMarginPercentage,
  isMarginBelowMinimum,
  formatPrice,
} from './rounding';

describe('applyRounding', () => {
  describe('EXACT rule', () => {
    it('should return value with 2 decimal places', () => {
      expect(applyRounding(123.456, 'EXACT')).toBe(123.46);
      expect(applyRounding(123.454, 'EXACT')).toBe(123.45);
    });

    it('should handle whole numbers', () => {
      expect(applyRounding(100, 'EXACT')).toBe(100);
    });

    it('should handle zero', () => {
      expect(applyRounding(0, 'EXACT')).toBe(0);
    });
  });

  describe('NEAREST_INTEGER rule', () => {
    it('should round to nearest integer', () => {
      expect(applyRounding(123.4, 'NEAREST_INTEGER')).toBe(123);
      expect(applyRounding(123.6, 'NEAREST_INTEGER')).toBe(124);
      expect(applyRounding(123.5, 'NEAREST_INTEGER')).toBe(124);
    });

    it('should handle exact halves', () => {
      expect(applyRounding(100.5, 'NEAREST_INTEGER')).toBe(101);
    });
  });

  describe('PSYCHOLOGICAL rule', () => {
    it('should end in .90 for values under 100', () => {
      expect(applyRounding(45.23, 'PSYCHOLOGICAL')).toBe(45.90);
      expect(applyRounding(99.99, 'PSYCHOLOGICAL')).toBe(99.90);
    });

    it('should end in .99 for values 100 and over', () => {
      expect(applyRounding(123.45, 'PSYCHOLOGICAL')).toBe(123.99);
      expect(applyRounding(1000, 'PSYCHOLOGICAL')).toBe(1000.99);
    });

    it('should handle edge case at exactly 100', () => {
      expect(applyRounding(100, 'PSYCHOLOGICAL')).toBe(100.99);
    });
  });

  describe('SMART_HUNDREDS rule', () => {
    it('should round to nearest 10 for values under 100', () => {
      expect(applyRounding(94, 'SMART_HUNDREDS')).toBe(90);
      expect(applyRounding(95, 'SMART_HUNDREDS')).toBe(100);
      expect(applyRounding(45, 'SMART_HUNDREDS')).toBe(50);
    });

    it('should round to nearest 10 for values 100-1000', () => {
      expect(applyRounding(17283, 'SMART_HUNDREDS')).toBe(17280);
      expect(applyRounding(555, 'SMART_HUNDREDS')).toBe(560);
    });

    it('should round to nearest 10 for all values', () => {
      // Large values also round to tens for commercial pricing precision
      expect(applyRounding(12345, 'SMART_HUNDREDS')).toBe(12350);
      expect(applyRounding(17283, 'SMART_HUNDREDS')).toBe(17280);
    });

    it('should handle edge cases at boundaries', () => {
      expect(applyRounding(1000, 'SMART_HUNDREDS')).toBe(1000);
      expect(applyRounding(1001, 'SMART_HUNDREDS')).toBe(1000);
    });
  });
});

describe('calculateFinalPrice', () => {
  it('should calculate price with base margin', () => {
    // Cost: 1000, Margin: 40% -> 1400
    expect(calculateFinalPrice(1000, 40, 'EXACT')).toBe(1400);
  });

  it('should calculate price with override margin from exception', () => {
    // Cost: 1000, Override: 50% -> 1500
    const exception = { overrideMarginPercentage: 50 };
    expect(calculateFinalPrice(1000, 40, 'EXACT', exception)).toBe(1500);
  });

  it('should use fixed price from exception without rounding', () => {
    // Fixed price should be used directly
    const exception = { fixedPrice: 2500.50 };
    expect(calculateFinalPrice(1000, 40, 'SMART_HUNDREDS', exception)).toBe(2500.50);
  });

  it('should apply rounding rules to calculated price', () => {
    // Cost: 1000, Margin: 40% -> 1400
    expect(calculateFinalPrice(1000, 40, 'NEAREST_INTEGER')).toBe(1400);
    expect(calculateFinalPrice(1000, 40, 'PSYCHOLOGICAL')).toBe(1400.99);
  });

  it('should handle decimal costs', () => {
    // Cost: 12.345 with 40% margin = 17.283 -> rounded
    expect(calculateFinalPrice(12.345, 40, 'EXACT')).toBe(17.28);
  });

  it('should handle zero cost', () => {
    expect(calculateFinalPrice(0, 40, 'EXACT')).toBe(0);
  });

  it('should prioritize fixed price over margin', () => {
    const exception = {
      fixedPrice: 1000,
      overrideMarginPercentage: 50,
    };
    // Fixed price wins
    expect(calculateFinalPrice(500, 40, 'EXACT', exception)).toBe(1000);
  });

  it('should handle SMART_HUNDREDS with realistic scenario from spec', () => {
    // From spec: Cost $12,345, Margin 40% = $17,283 -> rounded to $17,280 (nearest 10)
    expect(calculateFinalPrice(12345, 40, 'SMART_HUNDREDS')).toBe(17280);
  });

  it('should handle PSYCHOLOGICAL with various ranges', () => {
    // Cost 50, Margin 40% = 70 -> under 100, ends in .90
    expect(calculateFinalPrice(50, 40, 'PSYCHOLOGICAL')).toBe(70.90);

    // Cost 200, Margin 40% = 280 -> over 100, ends in .99
    expect(calculateFinalPrice(200, 40, 'PSYCHOLOGICAL')).toBe(280.99);
  });
});

describe('calculateMarginPercentage', () => {
  it('should calculate margin from cost and final price', () => {
    expect(calculateMarginPercentage(1000, 1400)).toBe(40);
    expect(calculateMarginPercentage(1000, 1500)).toBe(50);
    expect(calculateMarginPercentage(1000, 1000)).toBe(0);
  });

  it('should handle zero cost', () => {
    expect(calculateMarginPercentage(0, 1000)).toBe(0);
  });

  it('should handle negative margin (loss)', () => {
    expect(calculateMarginPercentage(1000, 800)).toBe(-20);
  });
});

describe('isMarginBelowMinimum', () => {
  it('should return true when margin is below minimum', () => {
    expect(isMarginBelowMinimum(10, 15)).toBe(true);
    expect(isMarginBelowMinimum(5, 15)).toBe(true);
  });

  it('should return false when margin is at or above minimum', () => {
    expect(isMarginBelowMinimum(15, 15)).toBe(false);
    expect(isMarginBelowMinimum(20, 15)).toBe(false);
  });
});

describe('formatPrice', () => {
  it('should format price with default currency', () => {
    expect(formatPrice(1234.56)).toBe('$ 1.234,56');
  });

  it('should format price with custom currency', () => {
    expect(formatPrice(1234.56, 'USD')).toBe('USD 1.234,56');
  });

  it('should format whole numbers', () => {
    expect(formatPrice(1000)).toBe('$ 1.000,00');
  });
});
