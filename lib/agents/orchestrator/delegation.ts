import { tool } from 'ai';
import { z } from 'zod';
import { streamText, generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { customerTools } from '@/lib/services/customer';
import { productTools } from '@/lib/services/product';
import { readFileSync } from 'fs';
import { join } from 'path';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Delegation tool for customer operations
 * 
 * This tool delegates customer-related tasks to the customer sub-agent.
 */
export const delegateCustomer = tool({
  description: 'Delega tareas relacionadas con clientes (crear, buscar, gestionar) al agente especializado de clientes',
  inputSchema: z.object({
    task: z.string().describe('La tarea específica a realizar con clientes'),
    chatId: z.string().describe('ID del chat para persistencia'),
  }),
  execute: async ({ task, chatId }) => {
    // Load customer agent instructions
    const instructionsPath = join(process.cwd(), 'lib/agents/customers/instructions.md');
    const systemPrompt = readFileSync(instructionsPath, 'utf-8') + `\n\nCHAT_ID: ${chatId}`;

    // Use Groq for better rate limits during testing
    const modelName = process.env.GROQ_MODEL;
    if (!modelName) throw new Error('GROQ_MODEL env var is required');
    const model = groq(modelName);

    const result = await streamText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: model as any,
      system: systemPrompt,
      messages: [{ role: 'user', content: task }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: customerTools as any,
      temperature: 1,
    });

    const response = await result.text;
    return response;
  },
});

/**
 * Delegation tool for inventory operations
 * 
 * This tool delegates inventory-related tasks to the inventory sub-agent.
 */
export const delegateInventory = tool({
  description: 'Delega tareas relacionadas con inventario y productos (crear, buscar, gestionar) al agente especializado de inventario',
  inputSchema: z.object({
    task: z.string().describe('La tarea específica a realizar con inventario/productos'),
    chatId: z.string().describe('ID del chat para persistencia'),
  }),
  execute: async ({ task, chatId }) => {
    console.log('🔧 delegateInventory execute called', { task, chatId });

    // Load inventory agent instructions
    const instructionsPath = join(process.cwd(), 'lib/agents/inventory/instructions.md');
    const systemPrompt = readFileSync(instructionsPath, 'utf-8') + `\n\nCHAT_ID: ${chatId}`;

    console.log('📋 System prompt loaded, length:', systemPrompt.length);

    // Use Groq for better rate limits during testing
    const modelName = process.env.GROQ_MODEL;
    if (!modelName) throw new Error('GROQ_MODEL env var is required');
    const model = groq(modelName);

    console.log('🤖 Starting generateText for inventory agent (WITH tools + execution loop)');

    try {
      const messages: any[] = [{ role: 'user', content: task }];

      // Step 1: Initial call with tools
      let result = await generateText({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: model as any,
        system: systemPrompt,
        messages,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: productTools as any,
        temperature: 1,
      });

      console.log('📝 Step 1 - Response text:', result.text);
      console.log('🔧 Step 1 - Tool calls:', result.toolCalls?.length || 0);

      // Step 2: Execute tool calls if any
      if (result.toolCalls && result.toolCalls.length > 0) {
        // Add assistant message with tool calls
        messages.push({
          role: 'assistant',
          content: result.text,
          tool_calls: result.toolCalls.map((tc: any) => ({
            id: tc.toolCallId || tc.toolName,
            type: 'function',
            function: {
              name: tc.toolName,
              arguments: JSON.stringify(tc.args),
            },
          })),
        });

        // Execute each tool call
        for (const toolCall of result.toolCalls as any[]) {
          const toolArgs = toolCall.args || toolCall.arguments || {};
          console.log('🔧 Executing tool:', toolCall.toolName, 'with args:', JSON.stringify(toolArgs));

          const tool = (productTools as any)[toolCall.toolName];
          if (tool && tool.execute) {
            const toolResult = await tool.execute(toolArgs);
            console.log('✅ Tool result:', toolResult);

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.toolCallId || toolCall.toolName,
              content: JSON.stringify(toolResult),
            });
          } else {
            console.error('❌ Tool not found:', toolCall.toolName);
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.toolCallId || toolCall.toolName,
              content: JSON.stringify({ error: `Tool ${toolCall.toolName} not found` }),
            });
          }
        }

        // Step 3: Call model again with tool results
        console.log('🤖 Step 3 - Calling model again with tool results');
        result = await generateText({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          model: model as any,
          system: systemPrompt,
          messages,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: productTools as any,
          temperature: 1,
        });

        console.log('📝 Step 3 - Response text:', result.text);
        console.log('🔧 Step 3 - Tool calls:', result.toolCalls?.length || 0);
      }

      return result.text;
    } catch (error) {
      console.error('❌ Error in generateText or execution:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));

      const isRateLimit = error instanceof Error && (
        error.message?.includes('429') ||
        error.message?.includes('rate_limit') ||
        error.message?.includes('Rate limit')
      );

      if (isRateLimit) {
        return 'Límite de uso alcanzado.';
      }

      throw error;
    }
  },
});
