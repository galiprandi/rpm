/**
 * Settings Service - Global configuration management
 *
 * Handles system-wide settings like minimum margin percentage
 */

import { db } from '@/lib/db';
import { setting } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Types
export interface Setting {
  id: string;
  key: string;
  value: string;
  updatedAt: Date;
}

export type SettingKey =
  | 'MINIMUM_MARGIN_PERCENTAGE'
  | 'AFIP_CUIT'
  | 'AFIP_PUNTO_VENTA'
  | 'AFIP_RESPONSABLE'
  | 'AFIP_PRODUCTION'
  | 'AFIP_CERT_PATH';

const DEFAULT_SETTINGS: Record<SettingKey, string> = {
  MINIMUM_MARGIN_PERCENTAGE: '15.0',
  AFIP_CUIT: '',
  AFIP_PUNTO_VENTA: '1',
  AFIP_RESPONSABLE: 'RI',
  AFIP_PRODUCTION: 'false',
  AFIP_CERT_PATH: '',
};

/**
 * Get a setting value by key
 */
export async function getSetting(key: SettingKey): Promise<string> {
  const s = await db.query.setting.findFirst({
    where: eq(setting.key, key),
  });

  return s?.value ?? DEFAULT_SETTINGS[key];
}

/**
 * Get minimum margin percentage as number
 */
export async function getMinimumMargin(): Promise<number> {
  const value = await getSetting('MINIMUM_MARGIN_PERCENTAGE');
  return parseFloat(value);
}

/**
 * Update a setting value
 */
export async function setSetting(key: SettingKey, value: string): Promise<Setting> {
  // Try to update first
  const [updated] = await db.update(setting)
    .set({ value, updatedAt: new Date().toISOString() })
    .where(eq(setting.key, key))
    .returning();

  if (updated) {
    return {
      ...updated,
      updatedAt: new Date(updated.updatedAt),
    };
  }

  // If no row was updated, insert
  const [created] = await db.insert(setting).values({
    id: crypto.randomUUID(),
    key,
    value,
    updatedAt: new Date().toISOString(),
  }).returning();

  return {
    ...created,
    updatedAt: new Date(created.updatedAt),
  };
}

/**
 * Initialize default settings if they don't exist
 */
export async function initializeDefaultSettings(): Promise<void> {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    // Check if setting exists
    const existing = await db.query.setting.findFirst({
      where: eq(setting.key, key),
    });

    if (!existing) {
      await db.insert(setting).values({
        id: crypto.randomUUID(),
        key,
        value,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}
