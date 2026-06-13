import { createAgent } from '../utils/createAgent';
import { composeSystemPrompt, type BotContext } from '../utils/promptComposer';
import { getToolsForRole } from '../utils/toolsByRole';
import { consultarStockTool } from '../stock/consultarStock';

/**
 * Create Orchestrator Agent - Bot principal que delega a subagentes
 * 
 * Este agente es el orquestador principal que:
 * - Recibe mensajes del usuario
 * - Delega tareas específicas a subagentes especializados
 * - Mantiene el contexto de la conversación
 * - Aplica prompts contextuales según rol del usuario
 */
export function createOrchestratorAgent(context: BotContext) {
  const roleTools = getToolsForRole(context.role);
  
  // Add consultarStock alongside existing tools
  const orchestratorTools = {
    ...roleTools,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    consultarStock: consultarStockTool as any,
  };

  // Use base instructions from file + context-specific additions
  const baseInstructions = './instructions.md';
  const contextInstructions = composeSystemPrompt(context);

  return createAgent({
    instructions: `${baseInstructions}\n\n${contextInstructions}`,
    tools: orchestratorTools,
  });
}
