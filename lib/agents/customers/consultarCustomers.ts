/**
 * Tool: consultarCustomers - Direct customer operations
 *
 * Especificaciones relacionadas:
 * - /specs/features/ai-bot-ger.md (Arquitectura Multi-Agente)
 */

import { tool } from 'ai';
import { z } from 'zod';
import { draftCustomerTool } from './tools/draftCustomer';
import { searchCustomersTool } from './tools/searchCustomers';
import { createCustomerTool } from './tools/createCustomer';
import logger from '../utils/logger';

export const consultarCustomersTool = tool({
  description: 'Operaciones de clientes: crear, buscar o gestionar clientes. Detecta la intención del usuario y usa la tool apropiada.',
  inputSchema: z.object({
    task: z.string().describe('Tarea relacionada con clientes (ej: "crear cliente Pedro", "buscar clientes con nombre Juan")'),
    chatId: z.string().optional().describe('ID del chat para persistir drafts (opcional)'),
  }),
  execute: async ({ task, chatId }) => {
    logger.debug({ task, chatId }, 'Processing customer task');
    
    // Simple intent detection
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('crear') || lowerTask.includes('agregar') || lowerTask.includes('nuevo')) {
      // Create customer - use draftCustomer
      logger.debug({ task }, 'Detected create intent, calling draftCustomer');
      // Extract name and phone from task
      const nameMatch = task.match(/(?:cliente|agregar|crear)\s+([a-zA-Z\s]+)/i);
      const phoneMatch = task.match(/teléfono\s*(\d+)/i);
      const name = nameMatch ? nameMatch[1].trim() : 'Cliente';
      const phone = phoneMatch ? phoneMatch[1] : undefined;
      
      if (!chatId) {
        return 'Necesito un chatId para crear un cliente. Por favor, proporciona el parámetro chatId.';
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (draftCustomerTool.execute as any)({ name, phone, chatId });
    } else if (lowerTask.includes('confirmar') || lowerTask.includes('sí') || lowerTask.includes('si') || lowerTask.includes('ok')) {
      // Confirm creation - use createCustomer
      logger.debug({ task }, 'Detected confirm intent, calling createCustomer');
      if (!chatId) {
        return 'Necesito un chatId para confirmar la creación del cliente.';
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (createCustomerTool.execute as any)({ chatId });
    } else if (lowerTask.includes('buscar') || lowerTask.includes('ver') || lowerTask.includes('listar')) {
      // Search customers
      logger.debug({ task }, 'Detected search intent, calling searchCustomers');
      const searchMatch = task.match(/(?:buscar|ver|listar)\s+(?:clientes?\s+)?(.+)/i);
      const search = searchMatch ? searchMatch[1].trim() : '';
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (searchCustomersTool.execute as any)({ search, limit: 10 });
    } else {
      // Default: ask for clarification
      return 'No estoy seguro de qué querés hacer con clientes. ¿Querés crear uno nuevo o buscar clientes existentes?';
    }
  },
});
