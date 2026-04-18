import { type UserRole } from './promptComposer';
import { getProductTool } from './tools/get-product';

/**
 * Tools available for each user role
 */
export const toolsByRole: Record<UserRole, Record<string, any>> = {
  ADMIN: {
    get_product: getProductTool,
  },
  SELLER: {
    get_product: getProductTool,
  },
  TECHNICIAN: {},
  STAFF: {
    get_product: getProductTool,
  },
};

/**
 * Get tools available for a specific role
 */
export function getToolsForRole(role: UserRole): Record<string, any> {
  return toolsByRole[role] || {};
}
