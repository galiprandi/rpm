/**
 * Tool: createProduct - Execute product creation from draft
 *
 * Especificaciones relacionadas:
 * - /specs/features/ai-bot-ger.md (Confirmación Obligatoria)
 *
 * Alcance del test:
 * - Validación de creación desde draft
 * - Validación de limpieza de draft después de crear
 */

import { tool } from 'ai';
import { z } from 'zod';
import { createProduct, type CreateProductInput } from '@/lib/services/productService';
import { getPendingAction, clearPendingAction } from '../../utils/pendingActions';
import logger from '../../utils/logger';

export const createProductTool = tool({
  description: 'Ejecuta la creación de un producto desde el draft guardado. Solo debe llamarse después de que el usuario confirma explícitamente.',
  inputSchema: z.object({
    chatId: z.string().describe('ID del chat para recuperar el draft'),
  }),
  execute: async ({ chatId }) => {
    logger.debug({ chatId }, 'Creating product from draft');

    const pending = getPendingAction(chatId);

    if (!pending || pending.type !== 'create_product') {
      return 'No hay un borrador de producto pendiente de confirmación. Por favor, inicia el proceso de creación nuevamente.';
    }

    try {
      const input: CreateProductInput = {
        name: pending.payload.name as string,
        categoryId: pending.payload.categoryId as string,
        costPrice: pending.payload.costPrice as number,
        replacementCost: pending.payload.replacementCost as number || pending.payload.costPrice as number,
        stock: pending.payload.stock as number,
        minStock: pending.payload.minStock as number || 5,
        supplierId: pending.payload.supplierId as string | undefined,
        barcode: pending.payload.barcode as string | undefined,
        sku: pending.payload.sku as string | undefined,
        description: pending.payload.description as string | undefined,
      };

      const product = await createProduct(input);
      clearPendingAction(chatId);

      return `✅ Producto creado exitosamente:\n- ID: ${product.id}\n- Nombre: ${product.name}\n- Stock: ${product.stock}\n- Costo: $${product.costPrice}\n- Margen: ${product.margin}%`;
    } catch (error) {
      logger.error({ chatId, error }, 'Failed to create product');
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return `❌ Error al crear el producto: ${message}`;
    }
  },
});
