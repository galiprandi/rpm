/**
 * Calculator Agent - Uses createAgent utility
 * Uses Gemini model from environment variables with automatic logging
 */
import { createAgent } from '../agentBuilder';
import { addTool } from './tools/add';
import { multiplyTool } from './tools/multiply';

interface CalculatorAgentOptions {
  apiKey?: string;
  model?: string;
}

export function createCalculatorAgent(options: CalculatorAgentOptions = {}) {
  return createAgent(
    {
      add: addTool,
      multiply: multiplyTool,
    },
    {
      ...options,
      name: 'CalculatorAgent',
    }
  );
}

// Default instance using environment variables
const calculatorAgent = createCalculatorAgent();

export default calculatorAgent;
