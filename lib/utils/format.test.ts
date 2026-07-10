import { describe, it, expect } from 'vitest';
import { capitalizeText, normalizeText, formatARS } from './format';

describe('capitalizeText', () => {
  it('should capitalize each word', () => {
    expect(capitalizeText('juan perez')).toBe('Juan Perez');
    expect(capitalizeText('JUAN PEREZ')).toBe('JUAN PEREZ');
    expect(capitalizeText('toyota hilux')).toBe('Toyota Hilux');
  });

  it('should handle single word', () => {
    expect(capitalizeText('juan')).toBe('Juan');
    expect(capitalizeText('rojo')).toBe('Rojo');
  });

  it('should handle empty and null values', () => {
    expect(capitalizeText('')).toBe('');
    expect(capitalizeText(null)).toBe('');
    expect(capitalizeText(undefined)).toBe('');
  });

  it('should trim whitespace', () => {
    expect(capitalizeText('  juan perez  ')).toBe('Juan Perez');
    expect(capitalizeText(' juan ')).toBe('Juan');
  });

  it('should handle special characters', () => {
    // Current implementation only capitalizes after spaces, not hyphens
    expect(capitalizeText('juan-perez')).toBe('Juan-perez');
    // Apostrophe is treated as part of the word, so "car" gets capitalized after the space
    expect(capitalizeText("juan's car")).toBe("Juan's Car");
  });
});

describe('formatARS', () => {
  it('should format numbers correctly without decimals by default', () => {
    // Note: space is often a non-breaking space in Intl.NumberFormat
    const result = formatARS(1234.56);
    expect(result.replace(/\u00A0/g, ' ')).toContain('$ 1.235');
  });

  it('should format numbers with specified decimals', () => {
    const result = formatARS(1234.56, 2);
    expect(result.replace(/\u00A0/g, ' ')).toContain('$ 1.234,56');
  });

  it('should handle zero', () => {
    const result = formatARS(0);
    expect(result.replace(/\u00A0/g, ' ')).toContain('$ 0');
  });
});

describe('normalizeText', () => {
  it('should convert to lowercase', () => {
    expect(normalizeText('Juan Perez')).toBe('juan perez');
    expect(normalizeText('TOYOTA')).toBe('toyota');
  });

  it('should trim whitespace', () => {
    expect(normalizeText('  Juan  ')).toBe('juan');
    expect(normalizeText('  toyota hilux  ')).toBe('toyota hilux');
  });

  it('should handle empty and null values', () => {
    expect(normalizeText('')).toBe('');
    expect(normalizeText(null)).toBe('');
    expect(normalizeText(undefined)).toBe('');
  });
});
