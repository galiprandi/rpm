/**
 * Generic Agent Builder Utility
 * Creates ToolLoopAgent instances with automatic logging
 */
import { ToolLoopAgent, tool } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import logger from '@/lib/logger';

interface AgentBuilderOptions {
  apiKey?: string;
  model?: string;
  name?: string;
}

interface ToolDefinition {
  description: string;
  inputSchema: z.ZodTypeAny;
  execute: (params: unknown) => Promise<unknown>;
}

export function createAgent(
  tools: Record<string, ToolDefinition>,
  options: AgentBuilderOptions = {}
) {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  const modelName = options.model || process.env.GEMINI_MODEL;
  const agentName = options.name || 'Agent';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required');
  }

  if (!modelName) {
    throw new Error('GEMINI_MODEL is required');
  }

  const model = createGoogleGenerativeAI({
    apiKey,
  })(modelName);

  // Wrap tools with logging
   
  const wrappedTools: Record<string, ReturnType<typeof tool>> = {};
  for (const [toolName, toolDef] of Object.entries(tools)) {
    // @ts-expect-error - AI SDK types are strict, this works in runtime
    wrappedTools[toolName] = tool({
      description: toolDef.description,
      inputSchema: toolDef.inputSchema,
      execute: async (params: unknown) => {
        logger.debug(
          { agent: agentName, tool: toolName },
          `[${agentName}] → ${toolName}`
        );
        
        const result = await toolDef.execute(params);
        
        logger.debug(
          { agent: agentName, tool: toolName, params, result },
          `[${agentName}] ✓ ${toolName}`
        );
        
        return result;
      },
    });
  }

   
   
  return new ToolLoopAgent({
    model,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: wrappedTools as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}
