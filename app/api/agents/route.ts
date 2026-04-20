/**
 * API Route: /api/agents
 * Methods: POST
 * Executes ToolLoopAgent instances for testing
 */
import { NextRequest, NextResponse } from 'next/server';
import weatherAgent from '@/lib/agents/weather/weatherAgent';
import calculatorAgent from '@/lib/agents/calculator/calculatorAgent';
import logger from '@/lib/logger';
import { z } from 'zod';

// Request schema
const requestSchema = z.object({
  agent: z.enum(['weather', 'calculator']).describe('Agent to execute'),
  prompt: z.string().describe('Prompt for the agent'),
});

// POST /api/agents - Execute an agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const { agent, prompt } = requestSchema.parse(body);

    logger.info({ agent, prompt }, 'Agent request received');

    let result;
    if (agent === 'weather') {
      logger.debug('Executing weather agent');
      result = await weatherAgent.generate({ prompt });
    } else if (agent === 'calculator') {
      logger.debug('Executing calculator agent');
      result = await calculatorAgent.generate({ prompt });
    }

    logger.info({ agent, steps: result?.steps?.length }, 'Agent execution completed');

    return NextResponse.json({
      text: result?.text,
      steps: result?.steps,
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error executing agent');
    return NextResponse.json(
      { error: 'Error executing agent', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
