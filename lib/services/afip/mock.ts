/**
 * Mock AFIP Service - Simulates AFIP responses for development and when no
 * certificate is configured.
 *
 * This is the fallback implementation. It produces realistic-looking but
 * fake CAE numbers and consults the local database for the last authorized
 * number instead of calling AFIP.
 */

import { db } from "@/lib/db";
import { invoice } from "@/db/schema";
import { eq, and, inArray, like, desc } from "drizzle-orm";
import { getSetting } from "../settingsService";
import type { AfipService, AFIPComprobanteInput, AFIPResponse } from "./types";
import { AFIP_CBTE_TIPOS } from "./types";

export class MockAfipService implements AfipService {
  /**
   * Simulates a CAE request. Generates a random CAE and computes the official
   * number from the local database.
   */
  async requestCAE(comprobante: AFIPComprobanteInput): Promise<AFIPResponse> {
    const isProduction = (await getSetting("AFIP_PRODUCTION")) === "true";
    const pv = await getSetting("AFIP_PUNTO_VENTA");
    const cuit = await getSetting("AFIP_CUIT");

    if (!cuit || !pv) {
      return {
        success: false,
        resultado: "R",
        error: "Configuración de AFIP incompleta (CUIT o Punto de Venta faltante)",
      };
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const nextNumber =
      (await this.getLastAuthorizedNumber(comprobante.tipo, Number(pv))) + 1;
    const numeroOficial = `${String(pv).padStart(4, "0")}-${String(nextNumber).padStart(8, "0")}`;

    return {
      success: true,
      cae: Math.random().toString().substring(2, 16),
      caeVencimiento: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      numeroOficial,
      resultado: "A",
      observaciones: isProduction ? [] : ["Operando en modo HOMOLOGACIÓN (mock)"],
    };
  }

  /**
   * Queries the local database for the last ISSUED invoice number.
   * In the real implementation this calls FECompUltimoAutorizado.
   */
  async getLastAuthorizedNumber(tipo: number, pv: number): Promise<number> {
    const pvPrefix = `${String(pv).padStart(4, "0")}-`;

    const internalTypes: string[] = [];
    if (tipo === AFIP_CBTE_TIPOS.FACTURA_A) internalTypes.push("FACTURA_A");
    else if (tipo === AFIP_CBTE_TIPOS.FACTURA_B) internalTypes.push("FACTURA_B");
    else if (tipo === AFIP_CBTE_TIPOS.FACTURA_C) internalTypes.push("FACTURA_C");
    else if (tipo === AFIP_CBTE_TIPOS.NOTA_CREDITO_A)
      internalTypes.push("NOTA_CREDITO_A");
    else if (tipo === AFIP_CBTE_TIPOS.NOTA_CREDITO_B)
      internalTypes.push("NOTA_CREDITO_B");
    else if (tipo === AFIP_CBTE_TIPOS.NOTA_CREDITO_C)
      internalTypes.push("NOTA_CREDITO_C");

    const lastInvoice = await db.query.invoice.findFirst({
      where: and(
        eq(invoice.status, "ISSUED"),
        inArray(invoice.type, internalTypes),
        like(invoice.number, `${pvPrefix}%`),
      ),
      orderBy: desc(invoice.number),
      columns: { number: true },
    });

    if (!lastInvoice) {
      return 0;
    }

    const parts = lastInvoice.number.split("-");
    const lastNumStr = parts[parts.length - 1];
    return parseInt(lastNumStr, 10);
  }

  /**
   * Simulates a connection test. Validates settings and CUIT checksum.
   */
  async checkConnection(): Promise<{ success: boolean; error?: string }> {
    const cuit = await getSetting("AFIP_CUIT");
    const pv = await getSetting("AFIP_PUNTO_VENTA");

    if (!cuit || !pv) {
      return {
        success: false,
        error:
          "Configuración fiscal incompleta: CUIT o Punto de Venta faltante.",
      };
    }

    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return { success: true };
  }

  /**
   * Simulates a voucher consultation for reconciliation.
   * In mock mode, always returns "not found" so PENDING invoices revert to DRAFT.
   */
  async consultVoucher(
    _tipo: number,
    _pv: number,
    _numero: number,
  ): Promise<AFIPResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: false,
      resultado: "R",
      error: "Comprobante no encontrado en AFIP (modo mock)",
    };
  }
}
