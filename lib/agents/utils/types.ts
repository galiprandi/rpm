import type { BotContext, UserRole } from "./promptComposer";

export type { BotContext, UserRole };

/**
 * Base input type for all bot tools
 * All tools receive the context automatically
 */
export interface BotToolInput<T = unknown> {
  context?: BotContext;
  [key: string]: T | BotContext | undefined;
}
