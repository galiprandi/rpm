import { createAgent } from '../utils/createAgent';
import { getProductTool } from '../tools/get-product';

/**
 * Stock Agent - Especialista en inventario de RPM Tucumán
 * 
 * Este subagente se encarga exclusivamente de consultar información
 * sobre productos, stock y precios. Su único objetivo es dar respuestas
 * precisas sobre el inventario.
 */
export const stockAgent = createAgent({
  instructions: './instructions.md',
  tools: {
    get_product: getProductTool,
  },
});
