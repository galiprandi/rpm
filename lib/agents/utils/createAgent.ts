import { ToolLoopAgent } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { readFileSync } from 'fs';
import { join } from 'path';

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Create agent helper - Centralized agent creation
 * 
 * @param options - Agent configuration options
 * @param options.instructions - System prompt instructions (can be a string or path to .md file)
 * @param options.tools - Tools object for the agent
 * @param options.model - Optional model name (defaults to OPENAI_MODEL env var or gpt-4o-mini)
 * @returns Configured ToolLoopAgent
 */
 
export function createAgent(options: {
  instructions: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools: Record<string, any>;
  model?: string;
}): ToolLoopAgent {
  let systemPrompt = options.instructions;

  // If instructions is a path to a .md file, read it
  if (options.instructions.endsWith('.md')) {
    try {
      const fullPath = join(process.cwd(), options.instructions);
      systemPrompt = readFileSync(fullPath, 'utf-8');
    } catch (error) {
      console.error(`Error reading instructions from ${options.instructions}:`, error);
      // Fallback to the original string if file read fails
      systemPrompt = options.instructions;
    }
  }

  return new ToolLoopAgent({
    model: openai(options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini'),
    instructions: systemPrompt,
    tools: options.tools,
  });
}
