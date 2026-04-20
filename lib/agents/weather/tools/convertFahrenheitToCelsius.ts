/**
 * Convert Fahrenheit to Celsius tool
 */
import { z } from 'zod';

export const convertFahrenheitToCelsiusTool = {
  description: 'Convert temperature from Fahrenheit to Celsius',
  inputSchema: z.object({
    temperature: z.number().describe('Temperature in Fahrenheit'),
  }),
  execute: async (params: unknown) => {
    const { temperature } = params as { temperature: number };
    const celsius = Math.round((temperature - 32) * (5 / 9));
    return { celsius };
  },
};
