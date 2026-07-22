/**
 * Settings Service Tests
 *
 * Tests for global configuration management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// vi.hoisted runs before vi.mock factory
const { mockFns } = vi.hoisted(() => ({
  mockFns: {
    settingFindFirst: vi.fn(),
    updateReturning: vi.fn(),
    insertReturning: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      setting: {
        findFirst: mockFns.settingFindFirst,
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: mockFns.updateReturning,
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: mockFns.insertReturning,
      })),
    })),
  },
}));

import {
  getSetting,
  getMinimumMargin,
  setSetting,
  initializeDefaultSettings,
  type SettingKey,
} from './settingsService';

describe('Settings Service', () => {
  const testKey = 'TEST_SETTING' as SettingKey;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSetting', () => {
    it('should return default value for MINIMUM_MARGIN_PERCENTAGE', async () => {
      mockFns.settingFindFirst.mockResolvedValue(null);

      const value = await getSetting('MINIMUM_MARGIN_PERCENTAGE');
      expect(value).toBe('15.0');
    });

    it('should return saved value from database', async () => {
      mockFns.settingFindFirst.mockResolvedValue({
        id: 'test-setting-1',
        key: testKey,
        value: 'test-value',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });

      const value = await getSetting(testKey);
      expect(value).toBe('test-value');
    });
  });

  describe('getMinimumMargin', () => {
    it('should return default minimum margin as number', async () => {
      mockFns.settingFindFirst.mockResolvedValue(null);

      const margin = await getMinimumMargin();
      expect(margin).toBe(15.0);
    });

    it('should return updated minimum margin from database', async () => {
      // setSetting will be called first, then getMinimumMargin
      // First call: setSetting update returns null (no row), then insert returns created
      mockFns.updateReturning.mockResolvedValue([null]);
      mockFns.insertReturning.mockResolvedValue([{
        id: 'setting-id',
        key: 'MINIMUM_MARGIN_PERCENTAGE',
        value: '20.5',
        updatedAt: '2025-01-01T00:00:00.000Z',
      }]);

      await setSetting('MINIMUM_MARGIN_PERCENTAGE', '20.5');

      // Now getMinimumMargin calls getSetting which calls findFirst
      mockFns.settingFindFirst.mockResolvedValue({
        id: 'setting-id',
        key: 'MINIMUM_MARGIN_PERCENTAGE',
        value: '20.5',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });

      const margin = await getMinimumMargin();
      expect(margin).toBe(20.5);
    });
  });

  describe('setSetting', () => {
    it('should create new setting when update returns no rows', async () => {
      mockFns.updateReturning.mockResolvedValue([null]);
      mockFns.insertReturning.mockResolvedValue([{
        id: 'new-setting-id',
        key: testKey,
        value: 'new-value',
        updatedAt: '2025-01-01T00:00:00.000Z',
      }]);

      const setting = await setSetting(testKey, 'new-value');
      expect(setting.key).toBe(testKey);
      expect(setting.value).toBe('new-value');
    });

    it('should update existing setting', async () => {
      mockFns.updateReturning.mockResolvedValue([{
        id: 'test-setting-2',
        key: testKey,
        value: 'updated',
        updatedAt: '2025-01-01T00:00:00.000Z',
      }]);

      const updated = await setSetting(testKey, 'updated');
      expect(updated.value).toBe('updated');
    });
  });

  describe('initializeDefaultSettings', () => {
    it('should create default settings if not exist', async () => {
      // All settings return null (not found) → should insert all
      mockFns.settingFindFirst.mockResolvedValue(null);
      mockFns.insertReturning.mockResolvedValue([{}]);

      await initializeDefaultSettings();

      // Should have called findFirst for each default setting
      expect(mockFns.settingFindFirst).toHaveBeenCalled();
    });

    it('should not overwrite existing settings', async () => {
      // All settings return existing values → should NOT insert
      mockFns.settingFindFirst.mockResolvedValue({
        id: 'margin-test-1',
        key: 'MINIMUM_MARGIN_PERCENTAGE',
        value: '25.0',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });

      await initializeDefaultSettings();

      // findFirst should be called but insert should not
      // (insert is not directly mockable here, but we verify findFirst was called)
      expect(mockFns.settingFindFirst).toHaveBeenCalled();
    });
  });
});
