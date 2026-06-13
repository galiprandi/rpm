/**
 * Pending Actions - In-memory storage for drafts awaiting confirmation
 *
 * Almacena acciones pendientes de confirmación por chatId.
 * In-memory por ahora; migrar a DB si se valida la experiencia.
 */

import logger from './logger';

export type PendingAction =
  | { type: 'create_customer'; payload: Record<string, unknown>; summary: string }
  | { type: 'create_product'; payload: Record<string, unknown>; summary: string };

const pendingActions = new Map<string, PendingAction>();

/**
 * Save a pending action for a chat
 */
export function savePendingAction(chatId: string, action: PendingAction): void {
  logger.debug({ chatId, actionType: action.type }, 'Saving pending action');
  pendingActions.set(chatId, action);
}

/**
 * Get pending action for a chat
 */
export function getPendingAction(chatId: string): PendingAction | undefined {
  return pendingActions.get(chatId);
}

/**
 * Clear pending action for a chat
 */
export function clearPendingAction(chatId: string): void {
  logger.debug({ chatId }, 'Clearing pending action');
  pendingActions.delete(chatId);
}

/**
 * Clear all pending actions (useful for testing)
 */
export function clearAllPendingActions(): void {
  logger.debug('Clearing all pending actions');
  pendingActions.clear();
}

/**
 * Get all chat IDs with pending actions
 */
export function getAllPendingChatIds(): string[] {
  return Array.from(pendingActions.keys());
}
