/**
 * Tests for pendingActions utility
 *
 * Especificaciones relacionadas:
 * - /specs/features/ai-bot-nitro.md (Sesión Conversacional, Confirmación Obligatoria)
 *
 * Alcance del test:
 * - Validación de guardado y recuperación de acciones pendientes
 * - Validación de limpieza de acciones pendientes
 * - Validación de listado de chat IDs con acciones pendientes
 *
 * Métricas cubiertas:
 * - Cobertura esperada: >90%
 * - Performance: <10ms por operación
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  savePendingAction,
  getPendingAction,
  clearPendingAction,
  clearAllPendingActions,
  getAllPendingChatIds,
} from './pendingActions';

describe('pendingActions', () => {
  beforeEach(() => {
    clearAllPendingActions();
  });

  describe('savePendingAction', () => {
    it('should save a create_customer action', () => {
      const chatId = 'chat-123';
      const action = {
        type: 'create_customer' as const,
        payload: { name: 'Pedro Corbalán', phone: '123456' },
        summary: 'Crear cliente Pedro Corbalán',
      };

      savePendingAction(chatId, action);

      const retrieved = getPendingAction(chatId);
      expect(retrieved).toEqual(action);
    });

    it('should save a create_product action', () => {
      const chatId = 'chat-456';
      const action = {
        type: 'create_product' as const,
        payload: { name: 'Barra LED', categoryId: 'cat-1' },
        summary: 'Crear producto Barra LED',
      };

      savePendingAction(chatId, action);

      const retrieved = getPendingAction(chatId);
      expect(retrieved).toEqual(action);
    });

    it('should overwrite existing action for same chatId', () => {
      const chatId = 'chat-789';
      const action1 = {
        type: 'create_customer' as const,
        payload: { name: 'Juan' },
        summary: 'Crear cliente Juan',
      };
      const action2 = {
        type: 'create_product' as const,
        payload: { name: 'Producto' },
        summary: 'Crear producto',
      };

      savePendingAction(chatId, action1);
      savePendingAction(chatId, action2);

      const retrieved = getPendingAction(chatId);
      expect(retrieved).toEqual(action2);
    });
  });

  describe('getPendingAction', () => {
    it('should return undefined for non-existent chatId', () => {
      const retrieved = getPendingAction('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should return saved action', () => {
      const chatId = 'chat-123';
      const action = {
        type: 'create_customer' as const,
        payload: { name: 'Pedro' },
        summary: 'Crear cliente Pedro',
      };

      savePendingAction(chatId, action);
      const retrieved = getPendingAction(chatId);

      expect(retrieved).toEqual(action);
    });
  });

  describe('clearPendingAction', () => {
    it('should remove action for chatId', () => {
      const chatId = 'chat-123';
      const action = {
        type: 'create_customer' as const,
        payload: { name: 'Pedro' },
        summary: 'Crear cliente Pedro',
      };

      savePendingAction(chatId, action);
      clearPendingAction(chatId);

      const retrieved = getPendingAction(chatId);
      expect(retrieved).toBeUndefined();
    });

    it('should not affect other chatIds', () => {
      const chatId1 = 'chat-123';
      const chatId2 = 'chat-456';
      const action1 = {
        type: 'create_customer' as const,
        payload: { name: 'Pedro' },
        summary: 'Crear cliente Pedro',
      };
      const action2 = {
        type: 'create_product' as const,
        payload: { name: 'Producto' },
        summary: 'Crear producto',
      };

      savePendingAction(chatId1, action1);
      savePendingAction(chatId2, action2);
      clearPendingAction(chatId1);

      expect(getPendingAction(chatId1)).toBeUndefined();
      expect(getPendingAction(chatId2)).toEqual(action2);
    });
  });

  describe('clearAllPendingActions', () => {
    it('should remove all pending actions', () => {
      const action1 = {
        type: 'create_customer' as const,
        payload: { name: 'Pedro' },
        summary: 'Crear cliente Pedro',
      };
      const action2 = {
        type: 'create_product' as const,
        payload: { name: 'Producto' },
        summary: 'Crear producto',
      };

      savePendingAction('chat-1', action1);
      savePendingAction('chat-2', action2);
      clearAllPendingActions();

      expect(getPendingAction('chat-1')).toBeUndefined();
      expect(getPendingAction('chat-2')).toBeUndefined();
    });
  });

  describe('getAllPendingChatIds', () => {
    it('should return empty array when no actions', () => {
      const ids = getAllPendingChatIds();
      expect(ids).toEqual([]);
    });

    it('should return all chatIds with pending actions', () => {
      const action1 = {
        type: 'create_customer' as const,
        payload: { name: 'Pedro' },
        summary: 'Crear cliente Pedro',
      };
      const action2 = {
        type: 'create_product' as const,
        payload: { name: 'Producto' },
        summary: 'Crear producto',
      };

      savePendingAction('chat-1', action1);
      savePendingAction('chat-2', action2);

      const ids = getAllPendingChatIds();
      expect(ids).toHaveLength(2);
      expect(ids).toContain('chat-1');
      expect(ids).toContain('chat-2');
    });
  });
});
