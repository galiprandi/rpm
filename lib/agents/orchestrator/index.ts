import { createAgent } from '../utils/createAgent';
import { composeSystemPrompt, type BotContext } from '../utils/promptComposer';
import { getToolsForRole, roleMap } from '../registry';

export function createOrchestratorAgent(context: BotContext) {
  const authRole = roleMap[context.role] || 'USER';
  const orchestratorTools = getToolsForRole(authRole);

  const baseInstructions = './instructions.md';
  const contextInstructions = composeSystemPrompt(context);

  return createAgent({
    instructions: `${baseInstructions}\n\n${contextInstructions}`,
    tools: orchestratorTools,
  });
}
