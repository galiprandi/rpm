import { describe, it, expect } from "vitest";
import {
  cleanAndNormalizePhone,
  formatArgentinePhone,
  validateArgentinePhone,
} from "../../lib/utils/phone-validation";

describe("phone-validation utility", () => {
  describe("cleanAndNormalizePhone", () => {
    it("should normalize a simple 10-digit number without country code", () => {
      expect(cleanAndNormalizePhone("1134567890")).toBe("5491134567890");
      expect(cleanAndNormalizePhone("3511234567")).toBe("5493511234567");
    });

    it("should normalize formatted numbers with spaces, hyphens, and +54", () => {
      expect(cleanAndNormalizePhone("+54 9 11 3456-7890")).toBe("5491134567890");
      expect(cleanAndNormalizePhone("+54 11 3456-7890")).toBe("5491134567890");
    });

    it("should remove leading zero from area code", () => {
      expect(cleanAndNormalizePhone("011 3456 7890")).toBe("5491134567890");
      expect(cleanAndNormalizePhone("0351 123 4567")).toBe("5493511234567");
    });

    it("should remove '15' prefix inside local part", () => {
      expect(cleanAndNormalizePhone("11 15 3456 7890")).toBe("5491134567890");
      expect(cleanAndNormalizePhone("351 15 123 4567")).toBe("5493511234567");
    });
  });

  describe("formatArgentinePhone", () => {
    it("should format AMBA (11) numbers beautifully", () => {
      expect(formatArgentinePhone("5491134567890")).toBe("+54 9 11 3456-7890");
    });

    it("should format Córdoba (351) numbers beautifully", () => {
      expect(formatArgentinePhone("5493511234567")).toBe("+54 9 351 1234-567");
    });

    it("should return raw if not matching standard normalized length", () => {
      expect(formatArgentinePhone("12345")).toBe("12345");
    });
  });

  describe("validateArgentinePhone", () => {
    it("should flag empty phone as invalid", () => {
      const res = validateArgentinePhone("");
      expect(res.isValid).toBe(false);
      expect(res.error).toBe("El teléfono no puede estar vacío");
    });

    it("should flag letters-only phone as invalid", () => {
      const res = validateArgentinePhone("abcd");
      expect(res.isValid).toBe(false);
    });

    it("should handle '15' prefix successfully", () => {
      const res = validateArgentinePhone("11 15 3456 7890");
      expect(res.isValid).toBe(true);
      expect(res.region).toBe("AMBA / Buenos Aires");
    });

    it("should successfully validate standard numbers and detect region", () => {
      const res1 = validateArgentinePhone("1134567890");
      expect(res1.isValid).toBe(true);
      expect(res1.region).toBe("AMBA / Buenos Aires");

      const res2 = validateArgentinePhone("+54 9 351 123 4567");
      expect(res2.isValid).toBe(true);
      expect(res2.region).toBe("Córdoba");
    });
  });
});
