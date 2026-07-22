/**
 * AFIP Service - Handles interaction with AFIP Web Services.
 * This is an initial implementation that prepares the structure for real integration.
 */

import { db } from '@/lib/db';
import { invoice } from '@/db/schema';
import { eq, and, inArray, like, desc } from 'drizzle-orm';
import { getSetting } from './settingsService';

export interface AFIPComprobanteInput {
  tipo: number; // 1: Factura A, 6: Factura B, etc.
  puntoVenta: number;
  customerDoc: string;
  customerDocType: 'CUIT' | 'DNI' | 'SIN_DOC';
  total: number;
  neto: number; // Importe neto gravado
  iva21: number; // Importe IVA 21%
  iva105: number; // Importe IVA 10.5%
  impOpEx?: number; // Importe operaciones exentas
  concept?: number; // 1: Productos, 2: Servicios, 3: Productos y Servicios
  fecha?: Date; // Fecha del comprobante
}

export interface AFIPResponse {
  success: boolean;
  cae?: string;
  caeVencimiento?: Date;
  numeroOficial?: string;
  resultado: 'A' | 'R'; // A: Aprobado, R: Rechazado
  observaciones?: string[];
  error?: string;
  code?: string; // AFIP error code
}

// AFIP Codes Mapping
export const AFIP_CBTE_TIPOS = {
  FACTURA_A: 1,
  FACTURA_B: 6,
  FACTURA_C: 11,
  NOTA_CREDITO_A: 3,
  NOTA_CREDITO_B: 8,
  NOTA_CREDITO_C: 13,
};

export const AFIP_DOC_TIPOS = {
  CUIT: 80,
  DNI: 96,
  SIN_DOC: 99,
};

/**
 * Sends a request to AFIP to authorize a voucher and obtain a CAE.
 * Initial implementation uses mock data for testing the flow.
 */
export async function requestCAE(comprobante: AFIPComprobanteInput): Promise<AFIPResponse> {
  const isProduction = (await getSetting('AFIP_PRODUCTION')) === 'true';
  const pv = await getSetting('AFIP_PUNTO_VENTA');
  const cuit = await getSetting('AFIP_CUIT');

  // Validate basic settings
  if (!cuit || !pv) {
    return {
      success: false,
      resultado: 'R',
      error: 'Configuración de AFIP incompleta (CUIT o Punto de Venta faltante)',
    };
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // In a real implementation, we would use a library like afip.js here.
  // For now, we simulate a successful response.

  // Example of a mock successful response
  const nextNumber = await getLastAuthorizedNumber(comprobante.tipo, Number(pv)) + 1;
  const numeroOficial = `${String(pv).padStart(4, '0')}-${String(nextNumber).padStart(8, '0')}`;

  return {
    success: true,
    cae: Math.random().toString().substring(2, 16), // Mock CAE
    caeVencimiento: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    numeroOficial,
    resultado: 'A',
    observaciones: isProduction ? [] : ['Operando en modo HOMOLOGACIÓN'],
  };
}

/**
 * Gets the last authorized number for a given voucher type and point of sale.
 * Filters the database for the last ISSUED invoice by both Point of Sale
 * (matching the number prefix) and the specific internal type keys.
 */
export async function getLastAuthorizedNumber(tipo: number, pv: number): Promise<number> {
  const pvPrefix = `${String(pv).padStart(4, '0')}-`;

  // Map AFIP tipo back to our internal type(s)
  const internalTypes: string[] = [];
  if (tipo === AFIP_CBTE_TIPOS.FACTURA_A) internalTypes.push('FACTURA_A');
  else if (tipo === AFIP_CBTE_TIPOS.FACTURA_B) internalTypes.push('FACTURA_B');
  else if (tipo === AFIP_CBTE_TIPOS.FACTURA_C) internalTypes.push('FACTURA_C');
  else if (tipo === AFIP_CBTE_TIPOS.NOTA_CREDITO_A) internalTypes.push('NOTA_CREDITO_A');
  else if (tipo === AFIP_CBTE_TIPOS.NOTA_CREDITO_B) internalTypes.push('NOTA_CREDITO_B');
  else if (tipo === AFIP_CBTE_TIPOS.NOTA_CREDITO_C) internalTypes.push('NOTA_CREDITO_C');

  const lastInvoice = await db.query.invoice.findFirst({
    where: and(
      eq(invoice.status, 'ISSUED'),
      inArray(invoice.type, internalTypes),
      like(invoice.number, `${pvPrefix}%`),
    ),
    orderBy: desc(invoice.number),
    columns: { number: true },
  });

  if (!lastInvoice) {
    return 0;
  }

  const parts = lastInvoice.number.split('-');
  const lastNumStr = parts[parts.length - 1];
  return parseInt(lastNumStr, 10);
}

/**
 * Validates a CUIT using the check digit algorithm.
 */
export function validateCUIT(cuit: string): boolean {
  const cleanCuit = cuit.replace(/[^\d]/g, '');
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
 * Checks connectivity with AFIP Web Services.
 */
export async function checkConnection(): Promise<{ success: boolean; error?: string }> {
  const cuit = await getSetting('AFIP_CUIT');
  const pv = await getSetting('AFIP_PUNTO_VENTA');

  if (!cuit || !pv) {
    return { success: false, error: 'Configuración fiscal incompleta: CUIT o Punto de Venta faltante.' };
  }

  if (!validateCUIT(cuit)) {
    return { success: false, error: 'El CUIT configurado no es válido.' };
  }

  // Simulate connection delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // In a real implementation, this would call FEDummy or similar.
  return { success: true };
}

/**
 * Maps our internal InvoiceType to AFIP CbteTipo code.
 */
export function mapInternalToAFIPType(type: string): number {
  switch (type) {
    case 'FACTURA_A':
    case 'X_A':
      return AFIP_CBTE_TIPOS.FACTURA_A;
    case 'FACTURA_B':
    case 'X_B':
      return AFIP_CBTE_TIPOS.FACTURA_B;
    case 'FACTURA_C':
    case 'X_C':
      return AFIP_CBTE_TIPOS.FACTURA_C;
    case 'NOTA_CREDITO_A':
    case 'NOTA_CREDITO_X_A':
      return AFIP_CBTE_TIPOS.NOTA_CREDITO_A;
    case 'NOTA_CREDITO_B':
    case 'NOTA_CREDITO_X_B':
      return AFIP_CBTE_TIPOS.NOTA_CREDITO_B;
    default:
      throw new Error(`Tipo de comprobante no soportado por AFIP: ${type}`);
  }
}
