/**
 * AFIP Service Factory - Returns the appropriate implementation based on
 * certificate health.
 *
 * Controlled degradation strategy:
 * - If cert health is `ready` → RealAfipService (calls afip.js)
 * - Any other state (missing, no-master-key, expired, invalid) → MockAfipService
 *
 * This ensures the system never crashes due to a missing, expired, or corrupt
 * certificate. It degrades gracefully to mock mode and the UI surfaces the
 * specific health state to the administrator.
 */

import { getCertHealth } from "../certService";
import { MockAfipService } from "./mock";
import { RealAfipService } from "./real";
import type { AfipService } from "./types";

// Re-export public types and constants
export type {
  AfipService,
  AFIPComprobanteInput,
  AFIPResponse,
} from "./types";
export { AFIP_CBTE_TIPOS, AFIP_DOC_TIPOS } from "./types";

let cachedService: AfipService | null = null;
let cachedHealthState: string | null = null;

/**
 * Returns the AFIP service implementation.
 * Evaluates cert health on every call (cheap — env var + DB read).
 * Caches the service instance per health state to avoid re-instantiating.
 */
export async function getAfipService(): Promise<AfipService> {
  const health = await getCertHealth();

  if (cachedService && cachedHealthState === health.state) {
    return cachedService;
  }

  cachedService = health.state === "ready" ? new RealAfipService() : new MockAfipService();
  cachedHealthState = health.state;
  return cachedService;
}
