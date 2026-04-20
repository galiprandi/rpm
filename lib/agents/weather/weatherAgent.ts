/**
 * Weather Agent - Uses createAgent utility
 * Uses Gemini model from environment variables with automatic logging
 */
import { createAgent } from '../agentBuilder';
import { weatherTool } from './tools/weather';
import { convertFahrenheitToCelsiusTool } from './tools/convertFahrenheitToCelsius';

interface WeatherAgentOptions {
  apiKey?: string;
  model?: string;
}

export function createWeatherAgent(options: WeatherAgentOptions = {}) {
  return createAgent(
    {
      weather: weatherTool,
      convertFahrenheitToCelsius: convertFahrenheitToCelsiusTool,
    },
    {
      ...options,
      name: 'WeatherAgent',
    }
  );
}

// Default instance using environment variables
const weatherAgent = createWeatherAgent();

export default weatherAgent;
