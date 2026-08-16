/**
 * Certificate Service Tests - AES-256-GCM encryption round-trip + health checks.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  isCertConfigured,
  storeCertificate,
  getCertificate,
  getCertificatePassword,
  removeCertificate,
  getCertHealth,
} from "./certService";

// Mock settings service
const mockSettings = new Map<string, string>();

vi.mock("./settingsService", () => ({
  getSetting: vi.fn((key: string) =>
    Promise.resolve(mockSettings.get(key) ?? ""),
  ),
  setSetting: vi.fn((key: string, value: string) => {
    mockSettings.set(key, value);
    return Promise.resolve({
      id: "test-id",
      key,
      value,
      updatedAt: new Date(),
    });
  }),
}));

const TEST_KEY = Buffer.alloc(32, 0x42).toString("base64");
const TEST_CERT = Buffer.from("fake-p12-content-for-testing");
const TEST_PASSWORD = "mySecretPassword123";

describe("certService", () => {
  beforeAll(() => {
    process.env.AFIP_CERT_MASTER_KEY = TEST_KEY;
  });

  afterAll(() => {
    delete process.env.AFIP_CERT_MASTER_KEY;
  });

  it("isCertConfigured returns true when master key is set", () => {
    expect(isCertConfigured()).toBe(true);
  });

  it("isCertConfigured returns false when master key is missing", () => {
    const original = process.env.AFIP_CERT_MASTER_KEY;
    delete process.env.AFIP_CERT_MASTER_KEY;
    expect(isCertConfigured()).toBe(false);
    process.env.AFIP_CERT_MASTER_KEY = original;
  });

  it("isCertConfigured returns false for invalid key length", () => {
    const original = process.env.AFIP_CERT_MASTER_KEY;
    process.env.AFIP_CERT_MASTER_KEY = Buffer.alloc(16).toString("base64");
    expect(isCertConfigured()).toBe(false);
    process.env.AFIP_CERT_MASTER_KEY = original;
  });

  it("encrypts and decrypts certificate round-trip", async () => {
    await storeCertificate(TEST_CERT, TEST_PASSWORD);

    const decrypted = await getCertificate();
    expect(decrypted).toEqual(TEST_CERT);

    const decryptedPassword = await getCertificatePassword();
    expect(decryptedPassword).toBe(TEST_PASSWORD);
  });

  it("throws when master key is not set", async () => {
    const original = process.env.AFIP_CERT_MASTER_KEY;
    delete process.env.AFIP_CERT_MASTER_KEY;

    await expect(storeCertificate(TEST_CERT, TEST_PASSWORD)).rejects.toThrow(
      "AFIP_CERT_MASTER_KEY",
    );

    process.env.AFIP_CERT_MASTER_KEY = original;
  });

  it("throws when certificate not in DB", async () => {
    mockSettings.clear();

    process.env.AFIP_CERT_MASTER_KEY = TEST_KEY;
    await expect(getCertificate()).rejects.toThrow(
      "Certificado AFIP no encontrado",
    );
  });

  it("removeCertificate clears all settings", async () => {
    await storeCertificate(TEST_CERT, TEST_PASSWORD);
    expect(mockSettings.get("AFIP_CERT_DATA")).toBeTruthy();

    await removeCertificate();
    expect(mockSettings.get("AFIP_CERT_DATA")).toBe("");
    expect(mockSettings.get("AFIP_CERT_IV")).toBe("");
    expect(mockSettings.get("AFIP_CERT_PASS_DATA")).toBe("");
  });
});

describe("getCertHealth", () => {
  beforeAll(() => {
    process.env.AFIP_CERT_MASTER_KEY = TEST_KEY;
  });

  afterAll(() => {
    delete process.env.AFIP_CERT_MASTER_KEY;
  });

  it("returns 'no-master-key' when AFIP_CERT_MASTER_KEY is missing", async () => {
    const original = process.env.AFIP_CERT_MASTER_KEY;
    delete process.env.AFIP_CERT_MASTER_KEY;

    const health = await getCertHealth();
    expect(health.state).toBe("no-master-key");
    expect(health.detail).toContain("AFIP_CERT_MASTER_KEY");

    process.env.AFIP_CERT_MASTER_KEY = original;
  });

  it("returns 'missing' when no cert data in DB", async () => {
    mockSettings.clear();
    process.env.AFIP_CERT_MASTER_KEY = TEST_KEY;

    const health = await getCertHealth();
    expect(health.state).toBe("missing");
    expect(health.detail).toContain("simulación");
  });

  it("returns 'ready' when cert is configured and decryptable", async () => {
    mockSettings.clear();
    process.env.AFIP_CERT_MASTER_KEY = TEST_KEY;
    await storeCertificate(TEST_CERT, TEST_PASSWORD);

    const health = await getCertHealth();
    expect(health.state).toBe("ready");
    expect(health.uploadedAt).toBeTruthy();
  });

  it("returns 'invalid' when cert data exists but IV is missing", async () => {
    mockSettings.clear();
    process.env.AFIP_CERT_MASTER_KEY = TEST_KEY;
    await storeCertificate(TEST_CERT, TEST_PASSWORD);
    // Corrupt: remove IV
    mockSettings.delete("AFIP_CERT_IV");

    const health = await getCertHealth();
    expect(health.state).toBe("invalid");
  });

  it("returns 'invalid' when master key is rotated (decryption fails)", async () => {
    mockSettings.clear();
    process.env.AFIP_CERT_MASTER_KEY = TEST_KEY;
    await storeCertificate(TEST_CERT, TEST_PASSWORD);

    // Rotate master key — decryption should fail
    process.env.AFIP_CERT_MASTER_KEY = Buffer.alloc(32, 0x99).toString("base64");

    const health = await getCertHealth();
    expect(health.state).toBe("invalid");
    expect(health.detail).toContain("descifrar");

    process.env.AFIP_CERT_MASTER_KEY = TEST_KEY;
  });

  it("returns 'expired' when expiresAt is in the past", async () => {
    mockSettings.clear();
    process.env.AFIP_CERT_MASTER_KEY = TEST_KEY;
    await storeCertificate(TEST_CERT, TEST_PASSWORD);
    // Manually set expiry to past
    mockSettings.set("AFIP_CERT_EXPIRES_AT", "2020-01-01T00:00:00.000Z");

    const health = await getCertHealth();
    expect(health.state).toBe("expired");
    expect(health.expiresAt).toBe("2020-01-01T00:00:00.000Z");
  });

  it("returns 'ready' when expiresAt is in the future", async () => {
    mockSettings.clear();
    process.env.AFIP_CERT_MASTER_KEY = TEST_KEY;
    await storeCertificate(TEST_CERT, TEST_PASSWORD);
    mockSettings.set("AFIP_CERT_EXPIRES_AT", "2099-01-01T00:00:00.000Z");

    const health = await getCertHealth();
    expect(health.state).toBe("ready");
    expect(health.expiresAt).toBe("2099-01-01T00:00:00.000Z");
  });
});
