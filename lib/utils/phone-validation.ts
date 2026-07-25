/**
 * Utility functions for validating and formatting Argentine phone numbers.
 */

export interface ArgRegion {
  code: string;
  name: string;
  short: string;
}

export const ARG_REGIONS: ArgRegion[] = [
  { code: "11", name: "AMBA / Buenos Aires", short: "AMBA (11)" },
  { code: "351", name: "Córdoba", short: "CBA (351)" },
  { code: "341", name: "Rosario", short: "ROS (341)" },
  { code: "261", name: "Mendoza", short: "MZA (261)" },
  { code: "381", name: "Tucumán", short: "TUC (381)" },
  { code: "221", name: "La Plata", short: "LPT (221)" },
  { code: "223", name: "Mar del Plata", short: "MDP (223)" },
  { code: "387", name: "Salta", short: "SLA (387)" },
  { code: "342", name: "Santa Fe", short: "SFE (342)" },
  { code: "299", name: "Neuquén", short: "NQN (299)" },
  { code: "264", name: "San Juan", short: "SJN (264)" },
  { code: "343", name: "Paraná", short: "PAR (343)" },
  { code: "379", name: "Corrientes", short: "CRR (379)" },
  { code: "362", name: "Resistencia", short: "RES (362)" },
  { code: "380", name: "La Rioja", short: "LRJ (380)" },
  { code: "383", name: "Catamarca", short: "CAT (383)" },
  { code: "385", name: "Santiago del Estero", short: "SDE (385)" },
  { code: "388", name: "Jujuy", short: "JUY (388)" },
  { code: "266", name: "San Luis", short: "SLU (266)" },
  { code: "2954", name: "Santa Rosa", short: "SRA (2954)" },
  { code: "280", name: "Rawson / Trelew", short: "RAW (280)" },
  { code: "2966", name: "Río Gallegos", short: "RGL (2966)" },
  { code: "2901", name: "Ushuaia", short: "USH (2901)" },
  { code: "2920", name: "Viedma", short: "VIE (2920)" },
];

/**
 * Normalizes a raw Argentine phone number input to "549[area_code][local_number]".
 * Resolves standard user typing issues:
 * - Drops country prefix (54, 054, 0054, +54) if present to parse cleanly.
 * - Drops leading 0 from area code.
 * - Drops 15 from mobile lines.
 */
export function cleanAndNormalizePhone(phone: string): string {
  if (!phone) return "";

  // Remove non-digit characters
  let digits = phone.replace(/\D/g, "");

  if (digits.length === 0) return "";

  // Drop leading international zeros or +54
  if (digits.startsWith("0054")) {
    digits = digits.substring(4);
  } else if (digits.startsWith("054")) {
    digits = digits.substring(3);
  } else if (digits.startsWith("54")) {
    digits = digits.substring(2);
  }

  // Remove mobile '9' prefix if it's there at start of remaining digits (e.g. 911...)
  if (digits.startsWith("9") && digits.length > 10) {
    digits = digits.substring(1);
  }

  // Remove leading 0 of area code if present
  if (digits.startsWith("0")) {
    digits = digits.substring(1);
  }

  // Detect and remove "15" prefix in local number
  // Buenos Aires (AMBA): 11 followed by 15 + 8 digits -> total 12 digits
  if (digits.startsWith("1115") && digits.length === 12) {
    digits = "11" + digits.substring(4);
  } else {
    // Other 3-digit area codes followed by 15 + 7 digits -> total 12 digits
    const threeDigitPrefixes = ARG_REGIONS.map(r => r.code).filter(c => c.length === 3);
    for (const prefix of threeDigitPrefixes) {
      if (digits.startsWith(prefix + "15") && digits.length === 12) {
        digits = prefix + digits.substring(prefix.length + 2);
        break;
      }
    }
  }

  // If we ended up with exactly 10 digits (Standard Arg Local format: Area Code + Number)
  if (digits.length === 10) {
    return "549" + digits;
  }

  // Fallback if not matching standard format
  return digits;
}

/**
 * Formats a normalized phone number (starts with 549 and has 13 digits)
 * for a polished user presentation: "+54 9 [area_code] [local_number]"
 */
export function formatArgentinePhone(normalized: string): string {
  if (!normalized) return "";
  if (normalized.startsWith("549") && normalized.length === 13) {
    const areaCode2 = normalized.substring(3, 5);
    // AMBA
    if (areaCode2 === "11") {
      return `+54 9 11 ${normalized.substring(5, 9)}-${normalized.substring(9)}`;
    }
    // 3-digit area codes
    const areaCode3 = normalized.substring(3, 6);
    const threeDigitCodes = ARG_REGIONS.map(r => r.code).filter(c => c.length === 3);
    if (threeDigitCodes.includes(areaCode3)) {
      return `+54 9 ${areaCode3} ${normalized.substring(6, 10)}-${normalized.substring(10)}`;
    }
    // 4-digit area codes or fallback
    const areaCode4 = normalized.substring(3, 7);
    return `+54 9 ${areaCode4} ${normalized.substring(7, 10)}-${normalized.substring(10)}`;
  }

  // If not standard normalized, return raw
  return normalized;
}

/**
 * Validates an Argentine phone number, returning whether it is valid,
 * the detected region name, a friendly error if not, and the normalized string.
 */
export function validateArgentinePhone(phone: string): {
  isValid: boolean;
  error?: string;
  region?: string;
  normalized?: string;
} {
  if (!phone || phone.trim() === "") {
    return { isValid: false, error: "El teléfono no puede estar vacío" };
  }

  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length === 0) {
    return { isValid: false, error: "El teléfono debe contener números" };
  }

  const normalized = cleanAndNormalizePhone(phone);
  if (!normalized || normalized.length !== 13 || !normalized.startsWith("549")) {
    // Help users correct '15' prefix issues if they typed an incomplete number
    if (phone.includes("15")) {
      return {
        isValid: false,
        error: "Por favor quita el '15' (ej: usa el código de área y número directamente)",
      };
    }
    // Help users correct leading zero issues if they typed an incomplete number
    if (digitsOnly.startsWith("0")) {
      return {
        isValid: false,
        error: "Por favor quita el '0' inicial del código de área",
      };
    }
    return {
      isValid: false,
      error: "Formato incorrecto. Debe tener 10 dígitos (ej: 11 3456-7890)",
    };
  }

  // Argentine area codes always start with 1, 2, or 3
  const firstDigit = normalized.charAt(3);
  if (firstDigit !== "1" && firstDigit !== "2" && firstDigit !== "3") {
    return {
      isValid: false,
      error: "Código de área inválido (debe comenzar con 1, 2 o 3)",
    };
  }

  // Identify region based on area code
  const areaCode2 = normalized.substring(3, 5);
  const areaCode3 = normalized.substring(3, 6);
  const areaCode4 = normalized.substring(3, 7);

  let regionName = "Argentina";

  const r4 = ARG_REGIONS.find((r) => r.code === areaCode4);
  const r3 = ARG_REGIONS.find((r) => r.code === areaCode3);
  const r2 = ARG_REGIONS.find((r) => r.code === areaCode2);

  if (r4) {
    regionName = r4.name;
  } else if (r3) {
    regionName = r3.name;
  } else if (r2) {
    regionName = r2.name;
  }

  return {
    isValid: true,
    region: regionName,
    normalized,
  };
}
