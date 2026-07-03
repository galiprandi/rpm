import { tool } from 'ai';
import { z } from 'zod';
import { createProductService } from '@/lib/services/product/createProduct/service';

/**
 * Simple createProductTool - Creates a product directly without draft/confirmation.
 *
 * Used for validating the single-agent architecture.
 */
export const createProductTool = tool({
  description:
    'Crea un producto directamente en la base de datos. Llama esta herramienta SOLO cuando el usuario haya proporcionado nombre, categoría, precio de costo y stock.',
  inputSchema: z.object({
    name: z.string().describe('Nombre del producto'),
    categoryId: z.string().describe('ID de la categoría'),
    costPrice: z.coerce.number().describe('Precio de costo (número)'),
    stock: z.coerce.number().describe('Cantidad en stock (número)'),
    sku: z.string().optional().describe('SKU'),
    description: z.string().optional().describe('Descripción'),
    barcode: z.string().optional().describe('Código de barras'),
    replacementCost: z.coerce.number().optional().describe('Precio de reemplazo (número)'),
    minStock: z.coerce.number().optional().describe('Stock mínimo (número)'),
    supplierId: z.string().optional().describe('ID del proveedor'),
    location: z.string().optional().describe('Ubicación'),
  }),
  execute: async (input) => {
    console.log('🔧 createProductTool called with:', JSON.stringify(input));

    try {
      const product = await createProductService({
        name: input.name,
        categoryId: input.categoryId,
        costPrice: input.costPrice,
        stock: input.stock,
        sku: input.sku,
        description: input.description,
        barcode: input.barcode,
        replacementCost: input.replacementCost ?? 0,
        minStock: input.minStock ?? 0,
        supplierId: input.supplierId,
        location: input.location,
      });

      console.log('✅ Product created:', product.id);

      return `Producto "${input.name}" creado exitosamente con ID: ${product.id}.`;
    } catch (error) {
      console.error('❌ Error creating product:', error);
      return `Error al crear el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
});
