/**
 * Weather tool - Gets the weather in a location (in Fahrenheit)
 */
import { z } from 'zod';

export const weatherTool = {
  description: 'Get the weather in a location (in Fahrenheit)',
  inputSchema: z.object({
    location: z.string().describe('The location to get the weather for'),
  }),
  execute: async (params: unknown) => {
    const { location } = params as { location: string };
    const temperature = 72 + Math.floor(Math.random() * 21) - 10;
    return { location, temperature };
  },
};
