/**
 * Settings Service Integration Tests
 *
 * Tests for global configuration management
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  getSetting,
  getMinimumMargin,
  setSetting,
  initializeDefaultSettings,
  type SettingKey,
} from './settingsService';
import { prisma } from '@/lib/prisma';

describe('Settings Service', () => {
  const testKey = 'TEST_SETTING' as SettingKey;

  beforeEach(async () => {
    // Clean up test data and restore default
    await prisma.setting.deleteMany({
      where: { key: testKey },
    });
    // Restore default margin for clean state
    await prisma.setting.upsert({
      where: { key: 'MINIMUM_MARGIN_PERCENTAGE' },
      update: { value: '15.0' },
      create: { 
        id: 'default-margin',
        key: 'MINIMUM_MARGIN_PERCENTAGE', 
        value: '15.0',
        updatedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.setting.deleteMany({
      where: { key: testKey },
    });
  });

  describe('getSetting', () => {
    it('should return default value for MINIMUM_MARGIN_PERCENTAGE', async () => {
      const value = await getSetting('MINIMUM_MARGIN_PERCENTAGE');
      expect(value).toBe('15.0');
    });

    it('should return saved value from database', async () => {
      await prisma.setting.create({
        data: { 
          id: 'test-setting-1',
          key: testKey, 
          value: 'test-value',
          updatedAt: new Date(),
        },
      });

      const value = await getSetting(testKey);
      expect(value).toBe('test-value');
    });
  });

  describe('getMinimumMargin', () => {
    it('should return default minimum margin as number', async () => {
      const margin = await getMinimumMargin();
      expect(margin).toBe(15.0);
    });

    it('should return updated minimum margin from database', async () => {
      await setSetting('MINIMUM_MARGIN_PERCENTAGE', '20.5');
      const margin = await getMinimumMargin();
      expect(margin).toBe(20.5);
    });
  });

  describe('setSetting', () => {
    it('should create new setting', async () => {
      const setting = await setSetting(testKey, 'new-value');
      expect(setting.key).toBe(testKey);
      expect(setting.value).toBe('new-value');
    });

    it('should update existing setting', async () => {
      await prisma.setting.create({
        data: { 
          id: 'test-setting-2',
          key: testKey, 
          value: 'original',
          updatedAt: new Date(),
        },
      });

      const updated = await setSetting(testKey, 'updated');
      expect(updated.value).toBe('updated');
    });
  });

  describe('initializeDefaultSettings', () => {
    it('should create default settings if not exist', async () => {
      // Delete existing
      await prisma.setting.deleteMany({
        where: { key: 'MINIMUM_MARGIN_PERCENTAGE' },
      });

      await initializeDefaultSettings();

      const setting = await prisma.setting.findUnique({
        where: { key: 'MINIMUM_MARGIN_PERCENTAGE' },
      });

      expect(setting).toBeDefined();
      expect(setting?.value).toBe('15.0');
    });

    it('should not overwrite existing settings', async () => {
      await prisma.setting.upsert({
        where: { key: 'MINIMUM_MARGIN_PERCENTAGE' },
        update: { value: '25.0' },
        create: { 
          id: 'margin-test-1',
          key: 'MINIMUM_MARGIN_PERCENTAGE', 
          value: '25.0',
          updatedAt: new Date(),
        },
      });

      await initializeDefaultSettings();

      const setting = await prisma.setting.findUnique({
        where: { key: 'MINIMUM_MARGIN_PERCENTAGE' },
      });

      expect(setting?.value).toBe('25.0');
    });
  });
});
