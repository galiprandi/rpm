/**
 * AFIP Service - Shared types and constants.
 *
 * These types are used by both the mock and real implementations.
 */

export interface AFIPComprobanteInput {
  tipo: number; // 1: Factura A, 6: Factura B, etc.
  puntoVenta: number;
  // Customer document
  customerDoc: string;
  customerDocType: "CUIT" | "DNI" | "SIN_DOC";
  // Monetary amounts
  total: number;
  neto: number; // Importe neto gravado
  iva21: number; // Importe IVA 21%
  iva105: number; // Importe IVA 10.5%
  impOpEx?: number; // Importe operaciones exentas
  // Required by AFIP wsfe
  concepto: 1 | 2 | 3; // 1: Productos, 2: Servicios, 3: Productos y Servicios
  cbteFch: string; // YYYYMMDD
  docTipo: number; // 80=CUIT, 96=DNI, 99=sin doc
  docNro: number; // sin guiones
  // Optional for services
  fchServDesde?: string; // YYYYMMDD
  fchServHasta?: string;
  fchVtoPago?: string;
  // Other tributos
  impTrib?: number; // default 0
}

export interface AFIPResponse {
  success: boolean;
  cae?: string;
  caeVencimiento?: Date;
  numeroOficial?: string;
  resultado: "A" | "R"; // A: Aprobado, R: Rechazado
  observaciones?: string[];
  error?: string;
  code?: string; // AFIP error code
}

export interface AfipService {
  requestCAE(comprobante: AFIPComprobanteInput): Promise<AFIPResponse>;
  getLastAuthorizedNumber(tipo: number, pv: number): Promise<number>;
  checkConnection(): Promise<{ success: boolean; error?: string }>;
  consultVoucher(
    tipo: number,
    pv: number,
    numero: number,
  ): Promise<AFIPResponse>;
}

// AFIP Codes Mapping
export const AFIP_CBTE_TIPOS = {
  FACTURA_A: 1,
  FACTURA_B: 6,
  FACTURA_C: 11,
  NOTA_CREDITO_A: 3,
  NOTA_CREDITO_B: 8,
  NOTA_CREDITO_C: 13,
} as const;

export const AFIP_DOC_TIPOS = {
  CUIT: 80,
  DNI: 96,
  SIN_DOC: 99,
} as const;
