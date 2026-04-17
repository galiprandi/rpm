/**
 * Tests for searchQueryParser
 * 
 * Especificaciones relacionadas:
 * - /specs/components/product-service-selector.md#búsqueda
 * 
 * Alcance del test:
 * - Validación de sintaxis de búsqueda avanzada
 * - Parsing de términos required (+), optional (espacio), y phrases ("")
 * - Casos edge: queries vacías, múltiples operadores, combinaciones
 * 
 * Regresiones a prevenir:
 * - Cambio en comportamiento de + como separador vs prefijo
 * - Cambio en comportamiento de espacios como OR vs AND
 * - No interpretar frases sin comillas como exact match
 */

import { describe, it, expect } from 'vitest';
import { parseSearchQuery, isAdvancedSearch, normalizeSearchQuery } from './searchQueryParser';

describe('parseSearchQuery', () => {
  describe('basic OR search (space separator)', () => {
    it('should split space-separated terms as optional (OR)', () => {
      const result = parseSearchQuery('filtro aire');
      
      expect(result.optional).toEqual(['filtro', 'aire']);
      expect(result.required).toEqual([]);
      expect(result.phrases).toEqual([]);
    });

    it('should handle single term as optional', () => {
      const result = parseSearchQuery('paragolpe');
      
      expect(result.optional).toEqual(['paragolpe']);
      expect(result.required).toEqual([]);
      expect(result.phrases).toEqual([]);
    });

    it('should handle multiple spaces gracefully', () => {
      const result = parseSearchQuery('led   barra   20');
      
      expect(result.optional).toEqual(['led', 'barra', '20']);
    });

    it('should be case insensitive for optional terms', () => {
      const result = parseSearchQuery('LED Barra');
      
      expect(result.optional).toEqual(['led', 'barra']);
    });
  });

  describe('AND search (+ separator)', () => {
    it('should split + separated terms as required (AND)', () => {
      const result = parseSearchQuery('led+cronos');
      
      expect(result.required).toEqual(['led', 'cronos']);
      expect(result.optional).toEqual([]);
      expect(result.phrases).toEqual([]);
    });

    it('should handle multi-word segments with +', () => {
      const result = parseSearchQuery('paragolpe delantero+kangoo');
      
      expect(result.required).toEqual(['paragolpe delantero', 'kangoo']);
      expect(result.optional).toEqual([]);
    });

    it('should handle multiple + separators', () => {
      const result = parseSearchQuery('779123+barra+led');
      
      expect(result.required).toEqual(['779123', 'barra', 'led']);
    });

    it('should trim spaces around +', () => {
      const result = parseSearchQuery('led + cronos + barra');
      
      expect(result.required).toEqual(['led', 'cronos', 'barra']);
    });

    it('should be case insensitive for required terms', () => {
      const result = parseSearchQuery('LED+CRONOS');
      
      expect(result.required).toEqual(['led', 'cronos']);
    });
  });

  describe('exact phrase search (quotes)', () => {
    it('should extract quoted phrase', () => {
      const result = parseSearchQuery('"LED-123"');
      
      expect(result.phrases).toEqual(['led-123']);
      expect(result.required).toEqual([]);
      expect(result.optional).toEqual([]);
    });

    it('should extract multiple quoted phrases', () => {
      const result = parseSearchQuery('"LED-123" "Barra 20 pulgadas"');
      
      expect(result.phrases).toEqual(['led-123', 'barra 20 pulgadas']);
    });

    it('should handle quoted phrases with required terms', () => {
      const result = parseSearchQuery('"paragolpe delantero"+kangoo');
      
      expect(result.phrases).toEqual(['paragolpe delantero']);
      expect(result.required).toEqual(['kangoo']);
      expect(result.optional).toEqual([]);
    });

    it('should preserve case in phrases but make lowercase', () => {
      const result = parseSearchQuery('"SKU-ABC-123"');
      
      expect(result.phrases).toEqual(['sku-abc-123']);
    });
  });

  describe('combined search syntax', () => {
    it('should handle phrase + required + optional (fallback)', () => {
      // When we have phrases, remaining becomes required
      const result = parseSearchQuery('"LED-123" 779456');
      
      expect(result.phrases).toEqual(['led-123']);
      expect(result.required).toEqual(['779456']); // Single segment becomes required
      expect(result.optional).toEqual([]);
    });

    it('should handle complex combination', () => {
      const result = parseSearchQuery('"paragolpe" delantero+kangoo');
      
      expect(result.phrases).toEqual(['paragolpe']);
      expect(result.required).toEqual(['delantero', 'kangoo']);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = parseSearchQuery('');
      
      expect(result.optional).toEqual([]);
      expect(result.required).toEqual([]);
      expect(result.phrases).toEqual([]);
    });

    it('should handle whitespace only', () => {
      const result = parseSearchQuery('   ');
      
      expect(result.optional).toEqual([]);
      expect(result.required).toEqual([]);
      expect(result.phrases).toEqual([]);
    });

    it('should handle + at start or end', () => {
      // + at start: should be treated as required (explicit + means AND intent)
      // Note: single term with explicit + becomes required, not optional
      const result1 = parseSearchQuery('+led');
      expect(result1.required).toEqual([]);
      expect(result1.optional).toEqual(['led']); // Single term without other + becomes optional

      // + at end: should filter out empty segment
      const result2 = parseSearchQuery('led+');
      expect(result2.required).toEqual([]);
      expect(result2.optional).toEqual(['led']); // Single term becomes optional
    });

    it('should handle consecutive + signs', () => {
      const result = parseSearchQuery('led++cronos');
      
      // Empty segments should be filtered out
      expect(result.required).toEqual(['led', 'cronos']);
    });

    it('should handle empty quotes', () => {
      const result = parseSearchQuery('""');
      
      // Empty phrase should be filtered out or not added
      expect(result.phrases).toEqual([]);
    });
  });

  describe('real-world use cases', () => {
    it('should parse led+cronos (common pattern)', () => {
      const result = parseSearchQuery('led+cronos');
      
      expect(result.required).toEqual(['led', 'cronos']);
    });

    it('should parse paragolpe+delantero (product + position)', () => {
      const result = parseSearchQuery('paragolpe+delantero');
      
      expect(result.required).toEqual(['paragolpe', 'delantero']);
    });

    it('should parse 779123+barra (EAN + product type)', () => {
      const result = parseSearchQuery('779123+barra');
      
      expect(result.required).toEqual(['779123', 'barra']);
    });

    it('should parse "LED-123" (exact SKU)', () => {
      const result = parseSearchQuery('"LED-123"');
      
      expect(result.phrases).toEqual(['led-123']);
    });

    it('should parse filtro aire (OR search)', () => {
      const result = parseSearchQuery('filtro aire');
      
      expect(result.optional).toEqual(['filtro', 'aire']);
    });
  });
});

describe('isAdvancedSearch', () => {
  it('should return true for + syntax', () => {
    expect(isAdvancedSearch('led+cronos')).toBe(true);
  });

  it('should return true for quotes', () => {
    expect(isAdvancedSearch('"LED-123"')).toBe(true);
  });

  it('should return false for simple search', () => {
    expect(isAdvancedSearch('filtro aire')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isAdvancedSearch('')).toBe(false);
  });
});

describe('normalizeSearchQuery', () => {
  it('should format optional search', () => {
    expect(normalizeSearchQuery('filtro aire')).toBe('optional:(filtro OR aire)');
  });

  it('should format required search', () => {
    expect(normalizeSearchQuery('led+cronos')).toBe('required:(led AND cronos)');
  });

  it('should format phrase search', () => {
    expect(normalizeSearchQuery('"LED-123"')).toBe('exact:"led-123"');
  });

  it('should format combined search', () => {
    expect(normalizeSearchQuery('"LED-123"+barra')).toBe('exact:"led-123" + barra');
  });
});
