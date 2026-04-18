import type { UserRole } from './promptComposer';

/**
 * Bot context injected automatically by the backend
 * Contains user role, current URL context, user ID, and email
 */
export interface BotContext {
  role: UserRole;
  currentUrl: {
    path: string;
    search: string;
    hash: string;
  };
  userId?: string;
  email?: string;
}

/**
 * Base input type for all bot tools
 * All tools receive the context automatically
 */
export interface BotToolInput<T = unknown> {
  context?: BotContext;
  [key: string]: T | BotContext | undefined;
}
