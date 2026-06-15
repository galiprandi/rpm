import type { UserRole } from '@/lib/auth/roles';
import { delegateCustomer, delegateInventory } from './orchestrator/delegation';

/**
 * Central Tool Registry for Orchestrator
 *
 * This registry provides delegation tools for the orchestrator agent.
 * The orchestrator does NOT have direct access to domain tools - it must
 * delegate to specialized sub-agents (customer, inventory).
 *
 * Architecture:
 * - Orchestrator (Nitro) → delegates to sub-agents
 * - Customer Agent → has direct customer tools
 * - Inventory Agent → has direct product tools
 */

// Delegation tools for the orchestrator
const orchestratorTools = {
  delegateCustomer,
  delegateInventory,
};

// Role-based tool access configuration
// Note: UserRole enum only has USER, STAFF, ADMIN
// SELLER and TECHNICIAN are mapped to ADMIN in getUserRole
const toolsByRole: Record<UserRole, Record<string, unknown>> = {
  ADMIN: {
    delegateCustomer: orchestratorTools.delegateCustomer,
    delegateInventory: orchestratorTools.delegateInventory,
  },
  STAFF: {
    delegateCustomer: orchestratorTools.delegateCustomer,
    delegateInventory: orchestratorTools.delegateInventory,
  },
  USER: {
    delegateCustomer: orchestratorTools.delegateCustomer,
    delegateInventory: orchestratorTools.delegateInventory,
  },
};

/**
 * Get tools for a specific role
 *
 * @param role - User role (USER, STAFF, ADMIN)
 * @returns Tools available for the role
 */
export function getToolsForRole(role: UserRole): Record<string, unknown> {
  return toolsByRole[role] || {};
}

/**
 * Get all tools (for debugging/admin purposes)
 *
 * @returns All registered delegation tools
 */
export function getAllTools(): Record<string, unknown> {
  return orchestratorTools;
}

/**
 * Get tool by name
 *
 * @param name - Tool name
 * @returns Tool if found, undefined otherwise
 */
export function getToolByName(name: string): unknown {
  return orchestratorTools[name as keyof typeof orchestratorTools];
}
