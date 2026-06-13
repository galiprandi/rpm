/**
 * Products Agent - Subagent specialized in product management
 *
 * Especificaciones relacionadas:
 * - /specs/features/ai-bot-ger.md (Arquitectura Multi-Agente)
 * - /specs/features/products-and-inventory.md
 */

import { createAgent } from '../utils/createAgent';
import { draftProductTool } from './tools/draftProduct';
import { searchCategoriesTool } from './tools/searchCategories';
import { searchSuppliersTool } from './tools/searchSuppliers';
import { createProductTool } from './tools/createProduct';

export const productsAgent = createAgent({
  instructions: './instructions.md',
  tools: {
    draftProduct: draftProductTool,
    searchCategories: searchCategoriesTool,
    searchSuppliers: searchSuppliersTool,
    createProduct: createProductTool,
  },
});
