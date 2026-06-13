import { tool } from 'ai';
import { z } from 'zod';
import { executeGetProduct } from '../tools/get-product/execute';

/**
 * consultarStock - Tool de delegación básica para consultas de stock
 * 
 * Esta tool permite al bot principal delegar consultas de inventario.
 * Implementación básica que llama directamente a get_product execute.
 */
export const consultarStockTool = tool({
  description: 'Útil para consultar disponibilidad, precios y stock de productos.',
  inputSchema: z.object({
    consulta: z.string().describe('Consulta sobre productos a realizar'),
  }),
  execute: async ({ consulta }) => {
    return await executeGetProduct({ query: consulta });
  },
});
