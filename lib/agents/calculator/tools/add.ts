/**
 * Add tool - Adds two numbers together
 */
import { z } from 'zod';

export const addTool = {
  description: 'Add two numbers together',
  inputSchema: z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }),
  execute: async (params: unknown) => {
    const { a, b } = params as { a: number; b: number };
    const result = a + b;
    return { result };
  },
};
