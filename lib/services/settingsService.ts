/**
 * Settings Service - Global configuration management
 *
 * Handles system-wide settings like minimum margin percentage
 */

import { prisma } from '@/lib/prisma';

// Types
export interface Setting {
  id: string;
  key: string;
  value: string;
  updatedAt: Date;
}

export type SettingKey = 'MINIMUM_MARGIN_PERCENTAGE';

const DEFAULT_SETTINGS: Record<SettingKey, string> = {
  MINIMUM_MARGIN_PERCENTAGE: '15.0',
};

/**
 * Get a setting value by key
 */
export async function getSetting(key: SettingKey): Promise<string> {
  const setting = await prisma.setting.findUnique({
    where: { key },
  });

  return setting?.value ?? DEFAULT_SETTINGS[key];
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
  return await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { 
      id: crypto.randomUUID(),
      key, 
      value,
      updatedAt: new Date(),
    },
  });
}

/**
 * Initialize default settings if they don't exist
 */
export async function initializeDefaultSettings(): Promise<void> {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { 
        id: crypto.randomUUID(),
        key, 
        value,
        updatedAt: new Date(),
      },
    });
  }
}
