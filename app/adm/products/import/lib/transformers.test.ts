/**
 * Tests for CSV Value Transformers
 * Run with: pnpm test -- products/import/lib/transformers.test.ts
 */

import {
  capitalizeTrim,
  uppercaseTrim,
  lowercaseTrim,
  trimOnly,
  parseEsNumber,
  resilientDecimal,
  resilientInteger,
  roundTo2,
  roundToInt,
  applyTransformer,
} from './transformers';

describe('capitalizeTrim', () => {
  it('capitalizes first letter of each word', () => {
    expect(capitalizeTrim('hello world')).toBe('Hello World');
  });

  it('handles single word', () => {
    expect(capitalizeTrim('product')).toBe('Product');
  });

  it('handles mixed case', () => {
    expect(capitalizeTrim('hElLo WoRlD')).toBe('Hello World');
  });

  it('trims whitespace', () => {
    expect(capitalizeTrim('  hello world  ')).toBe('Hello World');
  });
});

describe('uppercaseTrim', () => {
  it('converts to uppercase', () => {
    expect(uppercaseTrim('abc')).toBe('ABC');
  });

  it('trims whitespace', () => {
    expect(uppercaseTrim('  abc  ')).toBe('ABC');
  });
});

describe('lowercaseTrim', () => {
  it('converts to lowercase', () => {
    expect(lowercaseTrim('ABC')).toBe('abc');
  });

  it('trims whitespace', () => {
    expect(lowercaseTrim('  ABC  ')).toBe('abc');
  });
});

describe('trimOnly', () => {
  it('removes whitespace', () => {
    expect(trimOnly('  value  ')).toBe('value');
  });

  it('preserves case', () => {
    expect(trimOnly('  VaLuE  ')).toBe('VaLuE');
  });
});

describe('parseEsNumber', () => {
  it('handles Spanish format with comma decimal', () => {
    expect(parseEsNumber('52219,49')).toBe('52219.49');
  });

  it('handles quoted Spanish format', () => {
    expect(parseEsNumber('"52219,49"')).toBe('52219.49');
  });

  it('handles Spanish format with thousand separator', () => {
    expect(parseEsNumber('1.234,56')).toBe('1234.56');
  });

  it('handles simple integer', () => {
    expect(parseEsNumber('1234')).toBe('1234');
  });

  it('handles empty value', () => {
    expect(parseEsNumber('')).toBe('');
  });

  it('handles value with only quotes', () => {
    expect(parseEsNumber('""')).toBe('');
  });

  it('handles negative number', () => {
    expect(parseEsNumber('-3')).toBe('-3');
  });
});

describe('resilientDecimal', () => {
  it('handles Spanish format with comma decimal', () => {
    expect(resilientDecimal('52219,49')).toBe('52219.49');
  });

  it('handles Spanish format with thousand separator', () => {
    expect(resilientDecimal('52.219,49')).toBe('52219.49');
  });

  it('handles English format with dot decimal', () => {
    expect(resilientDecimal('52219.49')).toBe('52219.49');
  });

  it('handles English format with comma thousand separator', () => {
    expect(resilientDecimal('52,219.49')).toBe('52219.49');
  });

  it('handles quoted values', () => {
    expect(resilientDecimal('"52219,49"')).toBe('52219.49');
  });

  it('handles simple integer', () => {
    expect(resilientDecimal('1234')).toBe('1234');
  });

  it('handles empty value', () => {
    expect(resilientDecimal('')).toBe('');
  });

  it('handles zero decimal', () => {
    expect(resilientDecimal('1890')).toBe('1890');
  });

  it('handles negative with comma', () => {
    expect(resilientDecimal('-3')).toBe('-3');
  });
});

describe('resilientInteger', () => {
  it('removes dot separator', () => {
    expect(resilientInteger('1.234')).toBe('1234');
  });

  it('removes comma separator', () => {
    expect(resilientInteger('1,234')).toBe('1234');
  });

  it('removes decimal part', () => {
    expect(resilientInteger('1234.56')).toBe('1234');
  });

  it('handles quoted value', () => {
    expect(resilientInteger('"1234"')).toBe('1234');
  });

  it('handles negative', () => {
    expect(resilientInteger('-3')).toBe('-3');
  });
});

describe('roundTo2', () => {
  it('rounds to 2 decimals', () => {
    expect(roundTo2('123.456')).toBe('123.46');
  });

  it('pads to 2 decimals', () => {
    expect(roundTo2('123')).toBe('123.00');
  });

  it('returns original for non-numeric', () => {
    expect(roundTo2('abc')).toBe('abc');
  });
});

describe('roundToInt', () => {
  it('rounds to integer', () => {
    expect(roundToInt('123.7')).toBe('124');
  });

  it('returns integer for whole number', () => {
    expect(roundToInt('123')).toBe('123');
  });

  it('returns original for non-numeric', () => {
    expect(roundToInt('abc')).toBe('abc');
  });
});

describe('applyTransformer', () => {
  it('applies known transformer', () => {
    expect(applyTransformer('hello', 'capitalize_trim')).toBe('Hello');
  });

  it('returns original for unknown transformer', () => {
    expect(applyTransformer('hello', 'unknown')).toBe('hello');
  });

  it('returns original for empty value', () => {
    expect(applyTransformer('', 'capitalize_trim')).toBe('');
  });

  it('returns original with fallback on error', () => {
    // Simulate error by passing null-like value
    expect(applyTransformer('', 'parse_es_number', true)).toBe('');
  });

  it('applies array of transformers in chain', () => {
    // resilient_decimal converts comma to dot, then round_2 rounds to 2 decimals
    expect(applyTransformer('52219,49', ['resilient_decimal', 'round_2'])).toBe('52219.49');
  });

  it('applies array with single transformer', () => {
    expect(applyTransformer('52219,49', ['resilient_decimal'])).toBe('52219.49');
  });

  it('handles chain with capitalize and trim', () => {
    expect(applyTransformer('  hello world  ', ['trim', 'capitalize_trim'])).toBe('Hello World');
  });

  it('continues chain when one transformer is unknown', () => {
    expect(applyTransformer('52219,49', ['unknown', 'resilient_decimal', 'round_2'])).toBe('52219.49');
  });

  it('handles empty array of transformers', () => {
    expect(applyTransformer('hello', [])).toBe('hello');
  });

  it('handles resilient_decimal then round_2 with various formats', () => {
    // Spanish format with thousand separator
    expect(applyTransformer('1.234,56', ['resilient_decimal', 'round_2'])).toBe('1234.56');
    // English format
    expect(applyTransformer('1234.56', ['resilient_decimal', 'round_2'])).toBe('1234.56');
    // Simple integer
    expect(applyTransformer('1234', ['resilient_decimal', 'round_2'])).toBe('1234.00');
  });
});

// Test data from actual CSV
describe('Real CSV data', () => {
  it('handles PRECIO COMPRA values', () => {
    expect(resilientDecimal('24805')).toBe('24805');
  });

  it('handles MINORISTA values with quotes', () => {
    expect(resilientDecimal('"52219,49"')).toBe('52219.49');
  });

  it('handles MAYORISTA values', () => {
    expect(resilientDecimal('34727')).toBe('34727');
  });

  it('handles negative stock', () => {
    expect(resilientInteger('-3')).toBe('-3');
  });

  it('handles CONTADO values with quotes', () => {
    expect(resilientDecimal('"37300,01"')).toBe('37300.01');
  });
});
