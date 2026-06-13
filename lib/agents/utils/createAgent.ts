import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { readFileSync } from 'fs';
import { join } from 'path';
import logger from './logger';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

/**
 * Create agent helper - Centralized agent creation
 *
 * @param options - Agent configuration options
 * @param options.instructions - System prompt instructions (can be a string or path to .md file)
 * @param options.tools - Tools object for the agent
 * @param options.model - Optional model name (defaults to GEMINI_MODEL env var or gemini-1.5-flash-latest)
 * @returns Agent configuration object
 */

export function createAgent(options: {
  instructions: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools: Record<string, any>;
  model?: string;
}) {
  let systemPrompt = options.instructions;

  // If instructions is a path to a .md file, read it
  if (options.instructions.endsWith('.md')) {
    try {
      const fullPath = join(process.cwd(), options.instructions);
      systemPrompt = readFileSync(fullPath, 'utf-8');
    } catch (error) {
      logger.error({ instructions: options.instructions, error }, 'Error reading instructions from file');
      // Fallback to the original string if file read fails
      systemPrompt = options.instructions;
    }
  }

  return {
    model: google(options.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest'),
    instructions: systemPrompt,
    tools: options.tools,
  };
}
