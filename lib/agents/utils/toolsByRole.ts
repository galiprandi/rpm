import { type UserRole } from './promptComposer';
import { consultarStockTool } from '../stock/consultarStock';

/**
 * Tools available for each user role
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toolsByRole: Record<UserRole, Record<string, any>> = {
  ADMIN: {
    consultarStock: consultarStockTool,
  },
  SELLER: {
    consultarStock: consultarStockTool,
  },
  TECHNICIAN: {},
  STAFF: {
    consultarStock: consultarStockTool,
  },
};

/**
 * Get tools available for a specific role
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getToolsForRole(role: UserRole): Record<string, any> {
  return toolsByRole[role] || {};
}
