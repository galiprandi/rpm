import { tool } from 'ai';
import { z } from 'zod';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { readFileSync } from 'fs';
import { join } from 'path';
import { customerTools } from '@/lib/services/customer';
import { productTools } from '@/lib/services/product';
import { workOrderTools } from '../work-orders/tools';
import { financeTools } from '../finance/tools';
import logger from '../utils/logger';
import { sharedTools } from '../shared';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function createSubAgentTools(domainTools: Record<string, unknown>) {
  return { ...domainTools, ...sharedTools };
}

async function executeDelegation(
  instructionsPath: string,
  task: string,
  chatId: string,
  domainTools: Record<string, unknown>,
): Promise<string> {
  logger.debug({ chatId, taskLength: task.length, instructionsPath }, 'Delegation started');

  const fullPath = join(process.cwd(), instructionsPath);
  const systemPrompt = readFileSync(fullPath, 'utf-8') + `\n\nCHAT_ID: ${chatId}`;
  const allTools = createSubAgentTools(domainTools);

  try {
    const result = await generateText({
      model: groq(GROQ_MODEL) as any,
      system: systemPrompt,
      messages: [{ role: 'user', content: task }],
      tools: allTools as any,
      temperature: 1,
    });

    let finalText = result.text || '';

    if (result.toolCalls && result.toolCalls.length > 0) {
      for (const toolCall of result.toolCalls as any[]) {
        const toolFn = (allTools as any)[toolCall.toolName];
        if (toolFn?.execute) {
          const toolResult = await toolFn.execute(toolCall.args || {});
          finalText = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult);
        }
      }
    }

    return finalText || 'Listo.';
  } catch (error) {
    logger.error({ error, instructionsPath }, 'Delegation error');

    const isRateLimit = error instanceof Error && (
      error.message?.includes('429') ||
      error.message?.includes('rate_limit') ||
      error.message?.includes('Rate limit')
    );

    if (isRateLimit) {
      return 'Límite de uso alcanzado. Por favor, intentá de nuevo en unos segundos.';
    }

    throw error;
  }
}

export const delegateCustomer = tool({
  description: 'Delega tareas relacionadas con clientes (crear, buscar, gestionar) al agente especializado de clientes.',
  inputSchema: z.object({
    task: z.string().describe('La tarea específica a realizar con clientes'),
    chatId: z.string().describe('ID del chat para persistencia'),
  }),
  execute: async ({ task, chatId }) => {
    return executeDelegation('lib/agents/customers/instructions.md', task, chatId, customerTools);
  },
});

export const delegateInventory = tool({
  description: 'Delega tareas relacionadas con inventario y productos (crear, buscar, gestionar stock, consultar precios) al agente especializado de inventario.',
  inputSchema: z.object({
    task: z.string().describe('La tarea específica a realizar con inventario/productos'),
    chatId: z.string().describe('ID del chat para persistencia'),
  }),
  execute: async ({ task, chatId }) => {
    return executeDelegation('lib/agents/inventory/instructions.md', task, chatId, productTools);
  },
});

export const delegateWorkOrders = tool({
  description: 'Delega tareas relacionadas con órdenes de trabajo (crear OT, cambiar estado, consultar detalle, buscar OTs) al agente especializado de work orders.',
  inputSchema: z.object({
    task: z.string().describe('La tarea específica a realizar con OTs'),
    chatId: z.string().describe('ID del chat para persistencia'),
  }),
  execute: async ({ task, chatId }) => {
    return executeDelegation('lib/agents/work-orders/instructions.md', task, chatId, workOrderTools);
  },
});

export const delegateFinance = tool({
  description: 'Delega tareas relacionadas con finanzas y caja (consultar estado de caja, resumen del día, registrar ventas directas) al agente especializado de finanzas.',
  inputSchema: z.object({
    task: z.string().describe('La tarea específica a realizar con finanzas/caja'),
    chatId: z.string().describe('ID del chat para persistencia'),
  }),
  execute: async ({ task, chatId }) => {
    return executeDelegation('lib/agents/finance/instructions.md', task, chatId, financeTools);
  },
});
