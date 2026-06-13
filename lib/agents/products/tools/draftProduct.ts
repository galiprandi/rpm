/**
 * Tool: draftProduct - Save a product draft for confirmation
 *
 * Especificaciones relacionadas:
 * - /specs/features/ai-bot-ger.md (Confirmación Obligatoria)
 *
 * Alcance del test:
 * - Validación de guardado de draft
 * - Validación de generación de resumen
 */

import { tool } from 'ai';
import { z } from 'zod';
import { savePendingAction } from '../../utils/pendingActions';
import logger from '../../utils/logger';

export const draftProductTool = tool({
  description: 'Guarda un borrador de producto para confirmación. Debe llamarse antes de crear el producto para mostrar un resumen al usuario.',
  inputSchema: z.object({
    name: z.string().describe('Nombre del producto (obligatorio)'),
    categoryId: z.string().describe('ID de la categoría (obligatorio)'),
    costPrice: z.number().describe('Precio de costo (obligatorio)'),
    replacementCost: z.number().optional().describe('Precio de reemplazo (opcional)'),
    stock: z.number().describe('Stock inicial (obligatorio)'),
    minStock: z.number().optional().describe('Stock mínimo (opcional)'),
    supplierId: z.string().optional().describe('ID del proveedor (opcional)'),
    barcode: z.string().optional().describe('Código de barras (opcional)'),
    sku: z.string().optional().describe('SKU (opcional)'),
    description: z.string().optional().describe('Descripción (opcional)'),
    chatId: z.string().describe('ID del chat para persistir el draft'),
  }),
  execute: async ({ name, categoryId, costPrice, replacementCost, stock, minStock, supplierId, barcode, sku, description, chatId }) => {
    logger.debug({ chatId, name }, 'Drafting product');

    const payload: Record<string, unknown> = {
      name,
      categoryId,
      costPrice,
      ...(replacementCost && { replacementCost }),
      stock,
      ...(minStock && { minStock }),
      ...(supplierId && { supplierId }),
      ...(barcode && { barcode }),
      ...(sku && { sku }),
      ...(description && { description }),
    };

    const summary = `Producto: ${name}\nCategoría ID: ${categoryId}\nCosto: $${costPrice}${replacementCost ? `\nReemplazo: $${replacementCost}` : ''}\nStock: ${stock}${minStock ? `\nMínimo: ${minStock}` : ''}${supplierId ? `\nProveedor ID: ${supplierId}` : ''}${barcode ? `\nCódigo barras: ${barcode}` : ''}${sku ? `\nSKU: ${sku}` : ''}${description ? `\nDescripción: ${description}` : ''}`;

    savePendingAction(chatId, {
      type: 'create_product',
      payload,
      summary,
    });

    return `Borrador guardado. Resumen:\n${summary}\n\n¿Confirmas crear este producto?`;
  },
});
