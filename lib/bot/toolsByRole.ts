import type { Tool } from 'ai';
import { UserRole } from './promptComposer';

/**
 * Tools available for each user role
 * This ensures users can only access tools appropriate to their permissions
 */
export const toolsByRole: Record<UserRole, Record<string, Tool>> = {
  ADMIN: {
    // Tools will be added here following new architecture
  },

  SELLER: {
    // Tools will be added here following new architecture
  },

  TECHNICIAN: {
    // Tools will be added here following new architecture
  },

  STAFF: {
    // Tools will be added here following new architecture
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
