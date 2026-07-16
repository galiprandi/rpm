import logger from "./logger";

export type PendingAction =
  | {
      type: "create_customer";
      payload: Record<string, unknown>;
      summary: string;
    }
  | {
      type: "create_product";
      payload: Record<string, unknown>;
      summary: string;
    }
  | {
      type: "create_vehicle";
      payload: Record<string, unknown>;
      summary: string;
    }
  | {
      type: "update_product";
      payload: Record<string, unknown>;
      summary: string;
    };

const pendingActions = new Map<string, PendingAction>();

export function savePendingAction(chatId: string, action: PendingAction): void {
  logger.debug({ chatId, actionType: action.type }, "Saving pending action");
  pendingActions.set(chatId, action);
}

export function getPendingAction(chatId: string): PendingAction | undefined {
  return pendingActions.get(chatId);
}

export function clearPendingAction(chatId: string): void {
  logger.debug({ chatId }, "Clearing pending action");
  pendingActions.delete(chatId);
}

export function clearAllPendingActions(): void {
  logger.debug("Clearing all pending actions");
  pendingActions.clear();
}

export function getAllPendingChatIds(): string[] {
  return Array.from(pendingActions.keys());
}
