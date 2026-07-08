/**
 * AFIP Service - Handles interaction with AFIP Web Services.
 * This is an initial implementation that prepares the structure for real integration.
 */

import { getSetting } from './settingsService';

export interface AFIPComprobanteInput {
  tipo: number; // 1: Factura A, 6: Factura B, etc.
  puntoVenta: number;
  customerDoc: string;
  customerDocType: 'CUIT' | 'DNI' | 'SIN_DOC';
  total: number;
  neto: number;
  iva21: number;
  iva105: number;
  concept?: number; // 1: Productos, 2: Servicios, 3: Productos y Servicios
}

export interface AFIPResponse {
  success: boolean;
  cae?: string;
  caeVencimiento?: Date;
  numeroOficial?: string;
  resultado: 'A' | 'R'; // A: Aprobado, R: Rechazado
  observaciones?: string[];
  error?: string;
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
 */
export async function getLastAuthorizedNumber(tipo: number, pv: number): Promise<number> {
  // In a real implementation, this would call AFIP's FECompUltimoAutorizado.
  // For mock purposes, we could query our own DB for the last ISSUED invoice of this type,
  // or just return a static number for now.
  console.log(`Querying last authorized number for type ${tipo} and PV ${pv}`);
  return 125; // Static mock number
}

/**
 * Checks connectivity with AFIP Web Services.
 */
export async function checkConnection(): Promise<boolean> {
  // Simulate connection check
  return true;
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
