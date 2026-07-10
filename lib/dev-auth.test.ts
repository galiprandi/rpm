/**
 * Tests for lib/dev-auth.ts
 * Security-critical: validates the development auth bypass mechanism
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isDevBypassEnabled, createDevSession } from "./dev-auth";
import { UserRole } from "./auth/roles";

describe("dev-auth", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("isDevBypassEnabled", () => {
    it("returns false when NODE_ENV is not development", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("RPM_DEV_BYPASS_AUTH", "true");
      expect(isDevBypassEnabled()).toBe(false);
    });

    it("returns false when RPM_DEV_BYPASS_AUTH is not true", () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("RPM_DEV_BYPASS_AUTH", "false");
      expect(isDevBypassEnabled()).toBe(false);
    });

    it("returns false when RPM_DEV_BYPASS_AUTH is missing", () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("RPM_DEV_BYPASS_AUTH", "");
      expect(isDevBypassEnabled()).toBe(false);
    });

    it("returns true when both conditions are met", () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("RPM_DEV_BYPASS_AUTH", "true");
      expect(isDevBypassEnabled()).toBe(true);
    });

    it("returns false in test environment by default", () => {
      // vitest.config.ts sets process.env.NODE_ENV = 'test'
      expect(process.env.NODE_ENV).toBe("test");
      expect(isDevBypassEnabled()).toBe(false);
    });
  });

  describe("createDevSession", () => {
    it("returns default values when env vars are not set", () => {
      vi.stubEnv("RPM_DEV_BYPASS_ROLE", "");
      vi.stubEnv("RPM_DEV_BYPASS_USER_ID", "");
      vi.stubEnv("RPM_DEV_BYPASS_NAME", "");
      vi.stubEnv("RPM_DEV_BYPASS_EMAIL", "");

      const session = createDevSession();

      expect(session.user.id).toBe("dev-user");
      expect(session.user.name).toBe("Developer");
      expect(session.user.email).toBe("dev@localhost");
      expect(session.user.role).toBe(UserRole.ADMIN);
      expect(session.user.image).toBeNull();

      expect(session.session.userId).toBe("dev-user");
      expect(session.session.id).toMatch(/^dev-session-\d+$/);
      expect(session.session.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("respects custom env vars", () => {
      vi.stubEnv("RPM_DEV_BYPASS_ROLE", "STAFF");
      vi.stubEnv("RPM_DEV_BYPASS_USER_ID", "custom-id");
      vi.stubEnv("RPM_DEV_BYPASS_NAME", "Custom Name");
      vi.stubEnv("RPM_DEV_BYPASS_EMAIL", "custom@example.com");

      const session = createDevSession();

      expect(session.user.id).toBe("custom-id");
      expect(session.user.name).toBe("Custom Name");
      expect(session.user.email).toBe("custom@example.com");
      expect(session.user.role).toBe("STAFF");
    });

    it("returns a valid session object structure", () => {
      const session = createDevSession();

      expect(session).toHaveProperty("user");
      expect(session).toHaveProperty("session");
      expect(session.user).toHaveProperty("id");
      expect(session.user).toHaveProperty("name");
      expect(session.user).toHaveProperty("email");
      expect(session.user).toHaveProperty("role");
      expect(session.user).toHaveProperty("image");
      expect(session.session).toHaveProperty("id");
      expect(session.session).toHaveProperty("createdAt");
      expect(session.session).toHaveProperty("updatedAt");
      expect(session.session).toHaveProperty("expiresAt");
      expect(session.session).toHaveProperty("userId");
    });
  });
});
