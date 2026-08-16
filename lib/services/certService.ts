/**
 * Certificate Service - Encrypts/decrypts AFIP .p12 certificates using AES-256-GCM.
 *
 * The master key is read from the AFIP_CERT_MASTER_KEY environment variable
 * (32 bytes in base64). If the key is not set, the system falls back to mock mode.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getSetting, setSetting } from "./settingsService";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

/**
 * Certificate health states used for controlled degradation.
 * - `ready`: cert is configured, decryptable, and not expired → use RealAfipService
 * - `missing`: no cert data in DB → degrade to MockAfipService
 * - `no-master-key`: AFIP_CERT_MASTER_KEY env var missing or invalid → degrade to MockAfipService
 * - `expired`: cert is past its notAfter date → degrade to MockAfipService
 * - `invalid`: cert data exists but cannot be decrypted or parsed → degrade to MockAfipService
 */
export type CertHealthState =
  | "ready"
  | "missing"
  | "no-master-key"
  | "expired"
  | "invalid";

export interface CertHealth {
  state: CertHealthState;
  uploadedAt: string | null;
  expiresAt: string | null;
  /** Human-readable detail for UI/logging (never includes cert content) */
  detail: string;
}

/**
 * Returns the master key as a 32-byte Buffer, or null if not configured.
 */
function getMasterKey(): Buffer | null {
  const keyB64 = process.env.AFIP_CERT_MASTER_KEY;
  if (!keyB64) return null;
  const key = Buffer.from(keyB64, "base64");
  if (key.length !== 32) return null;
  return key;
}

/**
 * Checks whether the certificate system has the minimum configuration to attempt
 * real AFIP calls: AFIP_CERT_MASTER_KEY env var must be set and valid (32 bytes).
 *
 * Note: This does NOT check if a certificate exists in the DB. Use getCertHealth()
 * for a full health check.
 */
export function isCertConfigured(): boolean {
  return getMasterKey() !== null;
}

/**
 * Extracts the expiry date (notAfter) from a .p12 buffer by parsing it with node-forge.
 * Returns null if the expiry cannot be determined (e.g., wrong password, malformed cert).
 */
function extractExpiry(p12Buffer: Buffer, password: string): string | null {
  try {
    // Dynamic require to avoid loading forge in every cold start unless needed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const forge = require("node-forge") as typeof import("node-forge");
    const asn1 = forge.asn1;
    const p12Asn1 = asn1.fromDer(p12Buffer.toString("binary"));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    // getBags returns a Bags object with localKeyId and friendlyName keys
    const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBags = bags[forge.pki.oids.certBag] ?? [];

    for (const bag of certBags) {
      if (bag.asn1) {
        const cert = forge.pki.certificateFromAsn1(bag.asn1);
        if (cert.validity && cert.validity.notAfter) {
          return cert.validity.notAfter.toISOString();
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Encrypts a .p12 buffer and persists the encrypted data + IV + auth tag to settings.
 * Also encrypts and stores the certificate password.
 * Extracts and stores the certificate expiry date for health checks.
 */
export async function storeCertificate(
  p12Buffer: Buffer,
  password: string,
): Promise<{ uploadedAt: string; expiresAt: string | null }> {
  const key = getMasterKey();
  if (!key) {
    throw new Error(
      "AFIP_CERT_MASTER_KEY no configurada. Contacte al administrador para setear la variable de entorno.",
    );
  }

  // Extract expiry before encrypting (needs plaintext)
  const expiresAt = extractExpiry(p12Buffer, password);

  // Encrypt .p12
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(p12Buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Encrypt password
  const passIv = randomBytes(IV_LENGTH);
  const passCipher = createCipheriv(ALGORITHM, key, passIv);
  const passEncrypted = Buffer.concat([
    passCipher.update(password, "utf8"),
    passCipher.final(),
  ]);
  const passAuthTag = passCipher.getAuthTag();

  const uploadedAt = new Date().toISOString();

  await Promise.all([
    setSetting("AFIP_CERT_DATA", encrypted.toString("base64")),
    setSetting("AFIP_CERT_IV", iv.toString("base64")),
    setSetting("AFIP_CERT_AUTH_TAG", authTag.toString("base64")),
    setSetting("AFIP_CERT_UPLOADED_AT", uploadedAt),
    setSetting("AFIP_CERT_PASS_DATA", passEncrypted.toString("base64")),
    setSetting("AFIP_CERT_PASS_IV", passIv.toString("base64")),
    setSetting("AFIP_CERT_PASS_AUTH_TAG", passAuthTag.toString("base64")),
    setSetting(
      "AFIP_CERT_EXPIRES_AT",
      expiresAt ?? "",
    ),
  ]);

  return { uploadedAt, expiresAt };
}

/**
 * Reads, decrypts, and returns the .p12 certificate buffer from the database.
 * Throws if the certificate is not configured or decryption fails.
 */
export async function getCertificate(): Promise<Buffer> {
  const key = getMasterKey();
  if (!key) {
    throw new Error("AFIP_CERT_MASTER_KEY no configurada");
  }

  const [dataB64, ivB64, authTagB64] = await Promise.all([
    getSetting("AFIP_CERT_DATA"),
    getSetting("AFIP_CERT_IV"),
    getSetting("AFIP_CERT_AUTH_TAG"),
  ]);

  if (!dataB64 || !ivB64 || !authTagB64) {
    throw new Error("Certificado AFIP no encontrado en la base de datos");
  }

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);

  return decrypted;
}

/**
 * Reads, decrypts, and returns the certificate password from the database.
 */
export async function getCertificatePassword(): Promise<string> {
  const key = getMasterKey();
  if (!key) {
    throw new Error("AFIP_CERT_MASTER_KEY no configurada");
  }

  const [dataB64, ivB64, authTagB64] = await Promise.all([
    getSetting("AFIP_CERT_PASS_DATA"),
    getSetting("AFIP_CERT_PASS_IV"),
    getSetting("AFIP_CERT_PASS_AUTH_TAG"),
  ]);

  if (!dataB64 || !ivB64 || !authTagB64) {
    throw new Error("Password del certificado AFIP no encontrado");
  }

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Removes all certificate data and password from the database.
 */
export async function removeCertificate(): Promise<void> {
  await Promise.all([
    setSetting("AFIP_CERT_DATA", ""),
    setSetting("AFIP_CERT_IV", ""),
    setSetting("AFIP_CERT_AUTH_TAG", ""),
    setSetting("AFIP_CERT_UPLOADED_AT", ""),
    setSetting("AFIP_CERT_PASS_DATA", ""),
    setSetting("AFIP_CERT_PASS_IV", ""),
    setSetting("AFIP_CERT_PASS_AUTH_TAG", ""),
    setSetting("AFIP_CERT_EXPIRES_AT", ""),
  ]);
}

/**
 * Performs a full health check of the certificate system.
 *
 * This is the canonical source of truth for whether the system should use
 * RealAfipService or degrade to MockAfipService. It checks:
 * 1. Master key presence and validity
 * 2. Certificate data presence in DB
 * 3. Decryptability (actually attempts decryption)
 * 4. Expiry date (if stored)
 *
 * This function is safe to call on every request — it does not expose
 * certificate content and catches all errors internally.
 */
export async function getCertHealth(): Promise<CertHealth> {
  const key = getMasterKey();
  if (!key) {
    return {
      state: "no-master-key",
      uploadedAt: null,
      expiresAt: null,
      detail: "Falta la variable de entorno AFIP_CERT_MASTER_KEY",
    };
  }

  const [dataB64, uploadedAt, expiresAt] = await Promise.all([
    getSetting("AFIP_CERT_DATA"),
    getSetting("AFIP_CERT_UPLOADED_AT"),
    getSetting("AFIP_CERT_EXPIRES_AT"),
  ]);

  if (!dataB64 || dataB64.length === 0) {
    return {
      state: "missing",
      uploadedAt: null,
      expiresAt: null,
      detail: "No hay certificado subido. El sistema opera en modo simulación.",
    };
  }

  // Attempt decryption to verify integrity
  let decryptOk = false;
  try {
    const ivB64 = await getSetting("AFIP_CERT_IV");
    const authTagB64 = await getSetting("AFIP_CERT_AUTH_TAG");
    if (!ivB64 || !authTagB64) {
      return {
        state: "invalid",
        uploadedAt: uploadedAt.length > 0 ? uploadedAt : null,
        expiresAt: expiresAt.length > 0 ? expiresAt : null,
        detail: "Faltan vectores de cifrado (IV o auth tag). El certificado está corrupto.",
      };
    }

    const decipher = createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(ivB64, "base64"),
    );
    decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
    Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]);
    decryptOk = true;
  } catch {
    return {
      state: "invalid",
      uploadedAt: uploadedAt.length > 0 ? uploadedAt : null,
      expiresAt: expiresAt.length > 0 ? expiresAt : null,
      detail:
        "No se pudo descifrar el certificado. Posible rotación de master key o dato corrupto.",
    };
  }

  if (!decryptOk) {
    return {
      state: "invalid",
      uploadedAt: uploadedAt.length > 0 ? uploadedAt : null,
      expiresAt: expiresAt.length > 0 ? expiresAt : null,
      detail: "Error al descifrar el certificado.",
    };
  }

  // Check expiry
  if (expiresAt && expiresAt.length > 0) {
    const expiryDate = new Date(expiresAt);
    if (expiryDate < new Date()) {
      return {
        state: "expired",
        uploadedAt: uploadedAt.length > 0 ? uploadedAt : null,
        expiresAt,
        detail: `Certificado vencido el ${expiryDate.toLocaleDateString("es-AR")}. Suba un certificado nuevo para habilitar AFIP real.`,
      };
    }
  }

  return {
    state: "ready",
    uploadedAt: uploadedAt.length > 0 ? uploadedAt : null,
    expiresAt: expiresAt.length > 0 ? expiresAt : null,
    detail: "Certificado configurado y válido.",
  };
}
