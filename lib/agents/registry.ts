import { UserRole } from '@/lib/auth/roles';
import { delegateCustomer, delegateInventory, delegateWorkOrders, delegateFinance } from './orchestrator/delegation';
import { compositeTools } from './orchestrator/composite';
import type { UserRole as PromptUserRole } from './utils/promptComposer';

const delegationTools = {
  delegateCustomer,
  delegateInventory,
  delegateWorkOrders,
  delegateFinance,
};

const orchestratorTools = {
  ...delegationTools,
  ...compositeTools,
};

const toolsByRole: Record<UserRole, Record<string, unknown>> = {
  [UserRole.ADMIN]: { ...orchestratorTools },
  [UserRole.STAFF]: { ...orchestratorTools },
  [UserRole.USER]: { ...orchestratorTools },
};

export function getToolsForRole(role: UserRole): Record<string, unknown> {
  return toolsByRole[role] || {};
}

export function getDelegationTools(): Record<string, unknown> {
  return delegationTools;
}

export function getCompositeTools(): Record<string, unknown> {
  return compositeTools;
}

export function getAllTools(): Record<string, unknown> {
  return orchestratorTools;
}

export function getToolByName(name: string): unknown {
  return orchestratorTools[name as keyof typeof orchestratorTools];
}

export const roleMap: Record<PromptUserRole, UserRole> = {
  ADMIN: UserRole.ADMIN,
  STAFF: UserRole.STAFF,
  TECHNICIAN: UserRole.ADMIN,
  SELLER: UserRole.ADMIN,
};
