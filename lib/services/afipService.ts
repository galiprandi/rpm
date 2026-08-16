/**
 * AFIP Service - Public API (thin wrapper).
 *
 * Re-exports the strategy-based implementation from ./afip/index.ts
 * and keeps pure utility functions that don't need the strategy pattern.
 */

// Re-export strategy-based service
import { AFIP_CBTE_TIPOS, AFIP_DOC_TIPOS } from "./afip/types";
export { AFIP_CBTE_TIPOS, AFIP_DOC_TIPOS };
export {
  getAfipService,
  type AfipService,
  type AFIPComprobanteInput,
  type AFIPResponse,
} from "./afip/index";

/**
 * Validates a CUIT using the check digit algorithm (módulo 11).
 */
export function validateCUIT(cuit: string): boolean {
  const cleanCuit = cuit.replace(/[^\d]/g, "");
  if (cleanCuit.length !== 11) return false;

  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCuit[i]) * multipliers[i];
  }

  const checkDigit = parseInt(cleanCuit[10]);
  const result = 11 - (sum % 11);

  if (result === 11) return checkDigit === 0;
  if (result === 10) return false;
  return checkDigit === result;
}

/**
 * Maps our internal InvoiceType to AFIP CbteTipo code.
 */
export function mapInternalToAFIPType(type: string): number {
  switch (type) {
    case "FACTURA_A":
    case "X_A":
      return AFIP_CBTE_TIPOS.FACTURA_A;
    case "FACTURA_B":
    case "X_B":
      return AFIP_CBTE_TIPOS.FACTURA_B;
    case "FACTURA_C":
    case "X_C":
      return AFIP_CBTE_TIPOS.FACTURA_C;
    case "NOTA_CREDITO_A":
    case "NOTA_CREDITO_X_A":
      return AFIP_CBTE_TIPOS.NOTA_CREDITO_A;
    case "NOTA_CREDITO_B":
    case "NOTA_CREDITO_X_B":
      return AFIP_CBTE_TIPOS.NOTA_CREDITO_B;
    default:
      throw new Error(`Tipo de comprobante no soportado por AFIP: ${type}`);
  }
}
