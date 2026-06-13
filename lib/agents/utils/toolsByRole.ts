import { type UserRole } from './promptComposer';
import { consultarStockTool } from '../stock/consultarStock';
import { consultarCustomersTool } from '../customers/consultarCustomers';
import { consultarProductsTool } from '../products/consultarProducts';

/**
 * Tools available for each user role
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toolsByRole: Record<UserRole, Record<string, any>> = {
  ADMIN: {
    consultarStock: consultarStockTool,
    consultarCustomers: consultarCustomersTool,
    consultarProducts: consultarProductsTool,
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
