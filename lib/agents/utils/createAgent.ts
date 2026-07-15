import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { readFileSync } from 'fs';
import { join } from 'path';
import logger from './logger';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Create agent helper - Centralized agent creation
 * Returns configuration object (v6/v7 compatible pattern)
 *
 * @param options - Agent configuration options
 * @param options.instructions - System prompt instructions (can be a string or path to .md file)
 * @param options.tools - Tools object for the agent
 * @param options.model - Optional model name (defaults to GROQ_MODEL env var or llama-3.3-70b-versatile)
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

  // Use Groq if API key is available, otherwise fall back to Google
  const useGroq = !!process.env.GROQ_API_KEY;
  const model = options.model || (useGroq ? process.env.GROQ_MODEL : process.env.GEMINI_MODEL) || (useGroq ? 'llama-3.3-70b-versatile' : 'gemini-1.5-flash-latest');

  return {
    model: useGroq ? groq(model) : google(model),
    instructions: systemPrompt,
    tools: options.tools,
  };
}
