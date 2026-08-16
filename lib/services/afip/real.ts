/**
 * Real AFIP Service - Uses the afip.js library to call AFIP Web Services.
 *
 * This is a structural stub. The afip.js package is NOT installed yet.
 * When the wiring is done:
 *   1. Run `pnpm add afip.js`
 *   2. Complete the method bodies below using afip.ElectronicBilling.*
 *   3. The factory in index.ts will automatically use this implementation
 *      when a valid certificate is configured (health state === 'ready').
 *
 * Until then, all methods throw AfipCertError or AfipNotWiredError to make it
 * explicit that the real integration is not yet wired.
 */

import { getSetting } from "../settingsService";
import { getCertificate, getCertificatePassword } from "../certService";
import type { AfipService, AFIPComprobanteInput, AFIPResponse } from "./types";

/**
 * Error thrown when AFIP rejects the request due to a certificate problem
 * (expired, revoked, invalid). This allows the caller to potentially degrade
 * to mock mode at runtime, not just at factory time.
 */
export class AfipCertError extends Error {
  readonly code: string;
  constructor(message: string, code: string = "CERT_ERROR") {
    super(message);
    this.name = "AfipCertError";
    this.code = code;
  }
}

/**
 * Error thrown when the real service is called but afip.js is not yet wired.
 * This is a developer-facing error, not a user-facing one.
 */
export class AfipNotWiredError extends Error {
  constructor(method: string) {
    super(
      `AFIP real no configurado: ${method} pendiente de wiring con afip.js`,
    );
    this.name = "AfipNotWiredError";
  }
}

export class RealAfipService implements AfipService {
  /**
   * Initializes the afip.js client with the decrypted certificate.
   * TODO: import Afip from 'afip.js' and create instance here.
   */
  private async getClient(): Promise<unknown> {
    const cuit = await getSetting("AFIP_CUIT");
    const production = (await getSetting("AFIP_PRODUCTION")) === "true";

    const certBuffer = await getCertificate();
    const certPassword = await getCertificatePassword();

    // TODO: When afip.js is installed:
    // return new Afip({
    //   CUIT: Number(cuit),
    //   cert: certBuffer,
    //   key: certPassword, // afip.js accepts .p12 with password
    //   production,
    // });

    void certBuffer;
    void certPassword;
    void production;

    throw new AfipNotWiredError("getClient");
  }

  async requestCAE(_comprobante: AFIPComprobanteInput): Promise<AFIPResponse> {
    // TODO: const afip = await this.getClient();
    // const result = await afip.ElectronicBilling.createVoucher({...});
    // Map result to AFIPResponse
    // Catch AFIP cert errors and throw AfipCertError:
    //   if (result.Errors && result.Errors.ErrorCode === 404) {
    //     throw new AfipCertError(result.Errors.ErrorMessage, 'AFIP_CERT_REJECTED');
    //   }
    throw new AfipNotWiredError("requestCAE");
  }

  async getLastAuthorizedNumber(
    _tipo: number,
    _pv: number,
  ): Promise<number> {
    // TODO: const afip = await this.getClient();
    // const last = await afip.ElectronicBilling.getLastVoucher(pv, tipo);
    // return last;
    throw new AfipNotWiredError("getLastAuthorizedNumber");
  }

  async checkConnection(): Promise<{ success: boolean; error?: string }> {
    // TODO: const afip = await this.getClient();
    // const status = await afip.ElectronicBilling.getServerStatus();
    // return { success: true };
    throw new AfipNotWiredError("checkConnection");
  }

  async consultVoucher(
    _tipo: number,
    _pv: number,
    _numero: number,
  ): Promise<AFIPResponse> {
    // TODO: const afip = await this.getClient();
    // const result = await afip.ElectronicBilling.getVoucherInfo(numero, pv, tipo);
    // Map to AFIPResponse
    throw new AfipNotWiredError("consultVoucher");
  }
}
