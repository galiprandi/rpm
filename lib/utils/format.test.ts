import { describe, it, expect } from 'vitest';
import { capitalizeText, normalizeText } from './format';

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
