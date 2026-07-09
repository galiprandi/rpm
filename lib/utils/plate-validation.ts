/**
 * Utilidades para validación de patentes argentinas
 */

export const PLATE_REGEX = {
  // Autos/Camionetas/etc (1995-2016): AAA 111
  CAR_OLD: /^[A-Z]{3}\d{3}$/,
  // Autos/Camionetas/etc (Mercosur 2016+): AA 111 AA
  CAR_MERCOSUR: /^[A-Z]{2}\d{3}[A-Z]{2}$/,
  // Motos (Viejo): 111 AAA
  MOTO_OLD: /^\d{3}[A-Z]{3}$/,
  // Motos (Mercosur 2016+): A 111 AAA
  MOTO_MERCOSUR: /^[A-Z]\d{3}[A-Z]{3}$/,
  // Acoplados/Trailers: 101 AAA 111 (Comienza con 101 seguido de la patente del vehículo)
  TRAILER: /^101[A-Z]{3}\d{3}$|^101[A-Z]{2}\d{3}[A-Z]{2}$/,
};

/**
 * Valida si una patente cumple con alguno de los formatos argentinos vigentes.
 * @param plate La patente a validar
 * @returns boolean
 */
export function validatePlate(plate: string): boolean {
  if (!plate) return false;

  // Limpiar espacios y guiones, pasar a mayúsculas
  const sanitized = plate.replace(/[\s-]/g, "").toUpperCase();

  return (
    PLATE_REGEX.CAR_OLD.test(sanitized) ||
    PLATE_REGEX.CAR_MERCOSUR.test(sanitized) ||
    PLATE_REGEX.MOTO_OLD.test(sanitized) ||
    PLATE_REGEX.MOTO_MERCOSUR.test(sanitized) ||
    PLATE_REGEX.TRAILER.test(sanitized)
  );
}

/**
 * Retorna un mensaje descriptivo del formato esperado según el tipo de vehículo.
 * @param category Categoría del vehículo
 * @returns string
 */
export function getPlateFormatHint(category: string): string {
  if (category === "MOTORCYCLE") {
    return "Ej: 123ABC o A123ABC";
  }
  if (category === "TRAILER") {
    return "Ej: 101ABC123 o 101AB123CD";
  }
  return "Ej: ABC123 o AB123CD";
}
