/**
 * Cost Update Service Tests
 *
 * Unit tests for cost calculation logic, variation detection,
 * and warning thresholds.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateNewCost,
  calculateVariationPercent,
  isWarningVariation,
  type CostUpdateAdjustment,
} from './costUpdateService';

describe('calculateNewCost', () => {
  it('should increase cost by percentage', () => {
    const adjustment: CostUpdateAdjustment = { type: 'PERCENTAGE_INC', value: 10 };
    expect(calculateNewCost(100, adjustment)).toBeCloseTo(110, 2);
  });

  it('should decrease cost by percentage', () => {
    const adjustment: CostUpdateAdjustment = { type: 'PERCENTAGE_DEC', value: 10 };
    expect(calculateNewCost(100, adjustment)).toBe(90);
  });

  it('should increase cost by fixed amount', () => {
    const adjustment: CostUpdateAdjustment = { type: 'FIXED_INC', value: 50 };
    expect(calculateNewCost(100, adjustment)).toBe(150);
  });

  it('should decrease cost by fixed amount', () => {
    const adjustment: CostUpdateAdjustment = { type: 'FIXED_DEC', value: 30 };
    expect(calculateNewCost(100, adjustment)).toBe(70);
  });

  it('should handle decimal percentages', () => {
    const adjustment: CostUpdateAdjustment = { type: 'PERCENTAGE_INC', value: 12.5 };
    expect(calculateNewCost(100, adjustment)).toBe(112.5);
  });

  it('should handle zero adjustment', () => {
    const adjustment: CostUpdateAdjustment = { type: 'PERCENTAGE_INC', value: 0 };
    expect(calculateNewCost(100, adjustment)).toBe(100);
  });

  it('should handle zero current cost with percentage increase', () => {
    const adjustment: CostUpdateAdjustment = { type: 'PERCENTAGE_INC', value: 10 };
    expect(calculateNewCost(0, adjustment)).toBe(0);
  });

  it('should handle zero current cost with fixed increase', () => {
    const adjustment: CostUpdateAdjustment = { type: 'FIXED_INC', value: 50 };
    expect(calculateNewCost(0, adjustment)).toBe(50);
  });

  it('should calculate negative cost when decrease exceeds current', () => {
    const adjustment: CostUpdateAdjustment = { type: 'FIXED_DEC', value: 150 };
    expect(calculateNewCost(100, adjustment)).toBe(-50);
  });
});

describe('calculateVariationPercent', () => {
  it('should calculate positive variation', () => {
    expect(calculateVariationPercent(100, 120)).toBe(20);
  });

  it('should calculate negative variation', () => {
    expect(calculateVariationPercent(100, 80)).toBe(-20);
  });

  it('should return 0 when current cost is 0 and new cost is 0', () => {
    expect(calculateVariationPercent(0, 0)).toBe(0);
  });

  it('should return 100 when current cost is 0 and new cost is positive', () => {
    expect(calculateVariationPercent(0, 50)).toBe(100);
  });

  it('should handle decimal precision correctly', () => {
    expect(calculateVariationPercent(100, 123.456)).toBe(23.46);
  });

  it('should return 0 when costs are equal', () => {
    expect(calculateVariationPercent(100, 100)).toBe(0);
  });
});

describe('isWarningVariation', () => {
  it('should return true for variation above 20%', () => {
    expect(isWarningVariation(25)).toBe(true);
  });

  it('should return true for variation below -20%', () => {
    expect(isWarningVariation(-25)).toBe(true);
  });

  it('should return false for variation at exactly 20%', () => {
    expect(isWarningVariation(20)).toBe(false);
  });

  it('should return false for variation below 20%', () => {
    expect(isWarningVariation(19)).toBe(false);
  });

  it('should return false for variation between -20% and 20%', () => {
    expect(isWarningVariation(15)).toBe(false);
    expect(isWarningVariation(-15)).toBe(false);
  });

  it('should return false for zero variation', () => {
    expect(isWarningVariation(0)).toBe(false);
  });
});

describe('Edge cases', () => {
  it('should handle very large numbers', () => {
    const adjustment: CostUpdateAdjustment = { type: 'PERCENTAGE_INC', value: 50 };
    expect(calculateNewCost(1000000, adjustment)).toBe(1500000);
  });

  it('should handle very small numbers', () => {
    const adjustment: CostUpdateAdjustment = { type: 'PERCENTAGE_INC', value: 1 };
    expect(calculateNewCost(0.01, adjustment)).toBe(0.0101);
  });

  it('should handle 100% increase', () => {
    const adjustment: CostUpdateAdjustment = { type: 'PERCENTAGE_INC', value: 100 };
    expect(calculateNewCost(50, adjustment)).toBe(100);
  });

  it('should handle 100% decrease resulting in zero', () => {
    const adjustment: CostUpdateAdjustment = { type: 'PERCENTAGE_DEC', value: 100 };
    expect(calculateNewCost(50, adjustment)).toBe(0);
  });
});
