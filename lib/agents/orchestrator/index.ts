import { createAgent } from '../utils/createAgent';
import { composeSystemPrompt, type BotContext } from '../utils/promptComposer';
import { getToolsForRole } from '../registry';
import { UserRole as AuthUserRole } from '@/lib/auth/roles';

/**
 * Create Orchestrator Agent - Bot principal que delega a subagentes
 * 
 * Este agente es el orquestador principal que:
 * - Recibe mensajes del usuario
 * - Delega tareas específicas a subagentes especializados
 * - Mantiene el contexto de la conversación
 * - Aplica prompts contextuales según rol del usuario
 * 
 * Simplified to use the central registry for tool discovery.
 */
export function createOrchestratorAgent(context: BotContext) {
  // Map promptComposer UserRole to auth UserRole
  // promptComposer: 'ADMIN' | 'STAFF' | 'TECHNICIAN' | 'SELLER'
  // auth: 'USER' | 'STAFF' | 'ADMIN'
  const roleMap: Record<string, AuthUserRole> = {
    'ADMIN': AuthUserRole.ADMIN,
    'STAFF': AuthUserRole.STAFF,
    'TECHNICIAN': AuthUserRole.ADMIN, // Mapped to ADMIN for full access
    'SELLER': AuthUserRole.ADMIN, // Mapped to ADMIN for full access
  };
  
  const authRole = roleMap[context.role] || AuthUserRole.USER;
  
  // Get tools from central registry based on user role
  const orchestratorTools = getToolsForRole(authRole);

  // Use base instructions from file + context-specific additions
  const baseInstructions = './instructions.md';
  const contextInstructions = composeSystemPrompt(context);

  return createAgent({
    instructions: `${baseInstructions}\n\n${contextInstructions}`,
    tools: orchestratorTools,
  });
}
