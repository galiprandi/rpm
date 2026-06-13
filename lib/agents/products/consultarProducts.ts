/**
 * Tool: consultarProducts - Direct product operations
 *
 * Especificaciones relacionadas:
 * - /specs/features/ai-bot-ger.md (Arquitectura Multi-Agente)
 */

import { tool } from 'ai';
import { z } from 'zod';
import { draftProductTool } from './tools/draftProduct';
import { searchCategoriesTool } from './tools/searchCategories';
import { searchSuppliersTool } from './tools/searchSuppliers';
import { createProductTool } from './tools/createProduct';
import logger from '../utils/logger';

export const consultarProductsTool = tool({
  description: 'Operaciones de productos: crear, buscar o gestionar productos. Detecta la intención del usuario y usa la tool apropiada.',
  inputSchema: z.object({
    task: z.string().describe('Tarea relacionada con productos (ej: "crear producto Barra LED", "buscar productos LED")'),
    chatId: z.string().optional().describe('ID del chat para persistir drafts (opcional)'),
  }),
  execute: async ({ task, chatId }) => {
    logger.debug({ task, chatId }, 'Processing product task');
    
    // Simple intent detection
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('crear') || lowerTask.includes('agregar') || lowerTask.includes('nuevo')) {
      // Create product - need more info, ask for details
      logger.debug({ task }, 'Detected create intent, asking for details');
      return 'Para crear un producto necesito más información: nombre, categoría, precio de costo y stock inicial. ¿Podés darme estos datos?';
    } else if (lowerTask.includes('buscar') || lowerTask.includes('ver') || lowerTask.includes('listar')) {
      // Search products - for now, suggest using consultarStock
      logger.debug({ task }, 'Detected search intent');
      return 'Para buscar productos, usá la tool consultarStock. ¿Qué producto buscás?';
    } else if (lowerTask.includes('categoría') || lowerTask.includes('categorias')) {
      // Search categories
      logger.debug({ task }, 'Detected category search intent');
      const searchMatch = task.match(/(?:categoría|categorias?)\s+(.+)/i);
      const search = searchMatch ? searchMatch[1].trim() : '';
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (searchCategoriesTool.execute as any)({ search, limit: 10 });
    } else if (lowerTask.includes('proveedor') || lowerTask.includes('proveedores')) {
      // Search suppliers
      logger.debug({ task }, 'Detected supplier search intent');
      const searchMatch = task.match(/(?:proveedor|proveedores?)\s+(.+)/i);
      const search = searchMatch ? searchMatch[1].trim() : '';
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (searchSuppliersTool.execute as any)({ search, limit: 10 });
    } else {
      // Default: ask for clarification
      return 'No estoy seguro de qué querés hacer con productos. ¿Querés crear uno nuevo, buscar productos, categorías o proveedores?';
    }
  },
});
