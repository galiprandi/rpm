import type { Tool } from 'ai';
import { UserRole } from './promptComposer';

/**
 * Tools available for each user role
 * This ensures users can only access tools appropriate to their permissions
 *
 * TODO: Populate with new tools following spec:
 * - /specs/bot-tools/get-product.md
 */
export const toolsByRole: Record<UserRole, Record<string, Tool>> = {
  ADMIN: {
    // TODO: Add tools following new architecture
  },

  SELLER: {
    // TODO: Add tools following new architecture
  },

  TECHNICIAN: {
    // TODO: Add tools following new architecture
  },

  STAFF: {
    // TODO: Add tools following new architecture
  },
};

/**
 * Get tools filtered by user role
 * @param role - The user's role
 * @returns Object containing only the tools available for that role
 */
export function getToolsForRole(role: UserRole): Record<string, Tool> {
  return toolsByRole[role] || toolsByRole.STAFF;
}
