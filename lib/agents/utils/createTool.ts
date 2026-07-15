import { tool } from 'ai';
import type { z } from 'zod';

/**
 * createTool - Factory to eliminate boilerplate in tool creation
 *
 * Wraps the AI SDK `tool()` function with a simplified API.
 * Handles schema validation, service execution, and result formatting.
 *
 * @param config - Tool configuration
 * @param config.name - Tool name (for logging/debugging)
 * @param config.description - Tool description for the LLM
 * @param config.schema - Zod schema for input validation
 * @param config.service - Pure function that executes the business logic
 * @param config.format - Optional formatter for the result (defaults to JSON.stringify)
 *
 * @returns AI SDK tool object
 */
export function createTool<T extends z.ZodTypeAny>(config: {
  name: string;
  description: string;
  schema: T;
  service: (input: z.infer<T>) => Promise<unknown>;
  format?: (result: unknown) => string;
}) {

  return tool({
    description: config.description,
    inputSchema: config.schema,
    execute: async (input) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await config.service(input as any);
      return config.format ? config.format(result) : JSON.stringify(result);
    },
  }) as any;
}
