import { describe, it, expect } from 'vitest';
import { validatePlate } from './plate-validation';

describe('plate-validation', () => {
  describe('validatePlate', () => {
    it('should validate old car plates (AAA111)', () => {
      expect(validatePlate('AAA111')).toBe(true);
      expect(validatePlate('AAA 111')).toBe(true);
      expect(validatePlate('aaa111')).toBe(true);
      expect(validatePlate('AAA-111')).toBe(true);
    });

    it('should validate Mercosur car plates (AA111AA)', () => {
      expect(validatePlate('AA111AA')).toBe(true);
      expect(validatePlate('AA 111 AA')).toBe(true);
      expect(validatePlate('aa111aa')).toBe(true);
      expect(validatePlate('AA-111-AA')).toBe(true);
    });

    it('should validate old moto plates (111AAA)', () => {
      expect(validatePlate('111AAA')).toBe(true);
      expect(validatePlate('111 AAA')).toBe(true);
      expect(validatePlate('111-aaa')).toBe(true);
    });

    it('should validate Mercosur moto plates (A111AAA)', () => {
      expect(validatePlate('A111AAA')).toBe(true);
      expect(validatePlate('A 111 AAA')).toBe(true);
      expect(validatePlate('a111aaa')).toBe(true);
    });

    it('should validate trailer plates (101...)', () => {
      expect(validatePlate('101AAA111')).toBe(true);
      expect(validatePlate('101AA111AA')).toBe(true);
    });

    it('should fail on invalid formats', () => {
      expect(validatePlate('AA111')).toBe(false);
      expect(validatePlate('AAAA111')).toBe(false);
      expect(validatePlate('123456')).toBe(false);
      expect(validatePlate('ABCDEFG')).toBe(false);
      expect(validatePlate('')).toBe(false);
      expect(validatePlate(' ')).toBe(false);
    });
  });
});
