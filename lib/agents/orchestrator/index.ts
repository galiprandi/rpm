import { createAgent } from "../utils/createAgent";
import { composeSystemPrompt, type BotContext } from "../utils/promptComposer";
import { getToolsForRole } from "../registry";

export function createOrchestratorAgent(context: BotContext) {
  const tools = getToolsForRole(context.role);
  const systemPrompt = composeSystemPrompt(context);

  return createAgent({
    instructions: systemPrompt,
    tools,
  });
}
