/**
 * Shared vehicle type contracts between frontend and backend.
 *
 * These interfaces define the exact shape of data that:
 * - VehicleForm sends to the API
 * - API endpoints (POST /api/vehicles, PUT /api/vehicles/[id]) accept and return
 * - Frontend pages consume for display
 *
 * Related specs: /specs/customers.md, /specs/workshop.md
 */

// ─── Form / Input ─────────────────────────────────────────────

/**
 * Data emitted by VehicleForm on submit.
 * Uses makeName/modelName (strings) — the backend resolves them to IDs.
 */
export interface VehicleFormData {
  identifier: string;
  category: string;
  makeName?: string;
  modelName?: string;
  year?: string | number;
  color?: string;
  equipmentName?: string;
  equipmentType?: string;
  description?: string;
  notes?: string;
}

// ─── API Request Body ─────────────────────────────────────────

/**
 * Body accepted by POST /api/vehicles and PUT /api/vehicles/[id].
 * makeName/modelName take priority over makeId/modelId for resolution.
 */
export interface VehicleApiInput {
  identifier: string;
  category: VehicleCategory;
  customerId?: string; // required on POST, optional on PUT
  makeName?: string;
  modelName?: string;
  makeId?: string;
  modelId?: string;
  year?: number;
  color?: string;
  equipmentName?: string;
  equipmentType?: string;
  description?: string;
  notes?: string;
}

// ─── API Response ─────────────────────────────────────────────

export interface VehicleMakeRef {
  id: string;
  name: string;
  normalizedName: string;
}

export interface VehicleModelRef {
  id: string;
  makeId: string;
  name: string;
  normalizedName: string;
}

export interface VehicleCustomerRef {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

/**
 * Vehicle as returned by GET/POST/PUT /api/vehicles endpoints.
 * Uses Drizzle's vehicle_make / vehicle_model relation names.
 */
export interface VehicleApiResponse {
  id: string;
  identifier: string;
  category: VehicleCategory;
  makeId: string | null;
  modelId: string | null;
  year: number | null;
  color: string | null;
  equipmentName: string | null;
  equipmentType: string | null;
  description: string | null;
  notes: string | null;
  customerId: string;
  createdAt: string;
  updatedAt: string;
  vehicle_make?: VehicleMakeRef | null;
  vehicle_model?: VehicleModelRef | null;
  customer?: VehicleCustomerRef;
}

// ─── Frontend Display (transformed) ───────────────────────────

/**
 * Vehicle with make/model flattened to `make`/`model` for frontend convenience.
 * This is what GET /api/vehicles/[id] returns after its transformation step.
 */
export interface VehicleDisplay {
  id: string;
  identifier: string;
  category: VehicleCategory;
  makeId: string | null;
  modelId: string | null;
  year: number | null;
  color: string | null;
  equipmentName: string | null;
  equipmentType: string | null;
  description: string | null;
  notes: string | null;
  customerId: string;
  createdAt: string;
  updatedAt: string;
  make?: VehicleMakeRef | null;
  model?: VehicleModelRef | null;
  customer?: VehicleCustomerRef;
  workOrders?: unknown[];
}

// ─── Category Union ───────────────────────────────────────────

export type VehicleCategory =
  | "CAR"
  | "TRUCK"
  | "SUV"
  | "PICKUP"
  | "MOTORCYCLE"
  | "TRAILER"
  | "AUDIO_EQUIPMENT"
  | "ELECTRIC_SCOOTER"
  | "OTHER";

export const VEHICLE_CATEGORY_VALUES: readonly VehicleCategory[] = [
  "CAR",
  "TRUCK",
  "SUV",
  "PICKUP",
  "MOTORCYCLE",
  "TRAILER",
  "AUDIO_EQUIPMENT",
  "ELECTRIC_SCOOTER",
  "OTHER",
] as const;

export function isVehicleCategory(value: string): value is VehicleCategory {
  return (VEHICLE_CATEGORY_VALUES as readonly string[]).includes(value);
}
