/**
 * Valida un CUIT/CUIL argentino usando el algoritmo de módulo 11.
 * @param cuit El CUIT a validar (puede tener guiones o no)
 * @returns true si es válido, false en caso contrario
 */
export function validateCUIT(cuit: string): boolean {
  // Limpiar guiones y espacios
  const cleanCUIT = cuit.replace(/[-\s]/g, "");

  // Debe tener exactamente 11 dígitos
  if (cleanCUIT.length !== 11) return false;

  // Debe ser numérico
  if (!/^\d+$/.test(cleanCUIT)) return false;

  const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCUIT[i]) * factors[i];
  }

  const checkDigit = parseInt(cleanCUIT[10]);
  let computedCheckDigit = 11 - (sum % 11);

  if (computedCheckDigit === 11) computedCheckDigit = 0;
  if (computedCheckDigit === 10) computedCheckDigit = 9;

  return computedCheckDigit === checkDigit;
}

/**
 * Formatea un CUIT/CUIL con guiones (XX-XXXXXXXX-X)
 * @param cuit El CUIT a formatear
 * @returns El CUIT formateado
 */
export function formatCUIT(cuit: string): string {
  const clean = cuit.replace(/\D/g, "");
  if (clean.length <= 2) return clean;
  if (clean.length <= 10) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10, 11)}`;
}
