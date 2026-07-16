import { tool } from "ai";
import { createProductService } from "./service";
import { createProductSchema } from "./schema";
import {
  getPendingAction,
  clearPendingAction,
  savePendingAction,
  getAllPendingChatIds,
} from "@/lib/agents/utils/pendingActions";
import logger from "@/lib/agents/utils/logger";
import { z } from "zod";

/**
 * draftProductTool - Save a product draft for confirmation
 *
 * Uses the standard AI SDK tool() function for compatibility with streamText.
 */
export const draftProductTool = tool({
  description:
    "Guarda un borrador de producto para confirmación. Debe llamarse antes de crear el producto para mostrar un resumen al usuario.",
  inputSchema: z.object({
    chatId: z
      .string()
      .optional()
      .describe(
        "ID del chat para persistir el draft (se inyecta automáticamente)",
      ),
    name: z.string().describe("Nombre del producto"),
    categoryId: z.string().describe("ID de la categoría"),
    costPrice: z.number().describe("Precio de costo"),
    stock: z.number().describe("Cantidad en stock"),
    replacementCost: z.number().optional().describe("Precio de reemplazo"),
    minStock: z.number().optional().describe("Stock mínimo"),
    supplierId: z.string().optional().describe("ID del proveedor"),
    barcode: z.string().optional().describe("Código de barras"),
    sku: z.string().optional().describe("SKU"),
    description: z.string().optional().describe("Descripción"),
  }),
  execute: async (input) => {
    const {
      chatId,
      name,
      categoryId,
      costPrice,
      replacementCost,
      stock,
      minStock,
      supplierId,
      barcode,
      sku,
      description,
    } = input as {
      chatId?: string;
      name: string;
      categoryId: string;
      costPrice: number;
      replacementCost?: number;
      stock: number;
      minStock?: number;
      supplierId?: string;
      barcode?: string;
      sku?: string;
      description?: string;
    };

    logger.debug({ chatId, name }, "Drafting product");

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

    const summary = `Producto: ${name}\nCategoría ID: ${categoryId}\nCosto: $${costPrice}${replacementCost ? `\nReemplazo: $${replacementCost}` : ""}\nStock: ${stock}${minStock ? `\nMínimo: ${minStock}` : ""}${supplierId ? `\nProveedor ID: ${supplierId}` : ""}${barcode ? `\nCódigo barras: ${barcode}` : ""}${sku ? `\nSKU: ${sku}` : ""}${description ? `\nDescripción: ${description}` : ""}`;

    const effectiveChatId =
      chatId || `draft-create-${name.slice(0, 20)}-${Date.now()}`;

    savePendingAction(effectiveChatId, {
      type: "create_product",
      payload,
      summary,
    });

    return `Borrador guardado (ref: ${effectiveChatId}). Resumen:\n${summary}\n\n¿Confirmas crear este producto?`;
  },
});

/**
 * createProductTool - Execute product creation from draft
 *
 * Uses the standard AI SDK tool() function for compatibility with streamText.
 */
export const createProductTool = tool({
  description:
    "Ejecuta la creación de un producto desde el draft guardado. Solo debe llamarse después de que el usuario confirma explícitamente.",
  inputSchema: z.object({
    chatId: z
      .string()
      .optional()
      .describe(
        "ID del chat para recuperar el draft (se inyecta automáticamente)",
      ),
  }),
  execute: async (input) => {
    const { chatId } = input as { chatId?: string };

    logger.debug({ chatId }, "Creating product from draft");

    // If no chatId provided, try to find any pending create_product action
    let pending = chatId ? getPendingAction(chatId) : undefined;
    if (!pending && !chatId) {
      const allChatIds = getAllPendingChatIds();
      for (const id of allChatIds) {
        const action = getPendingAction(id);
        if (action && action.type === "create_product") {
          pending = action;
          clearPendingAction(id);
          break;
        }
      }
    }

    if (!pending || pending.type !== "create_product") {
      throw new Error(
        "No hay un borrador de producto pendiente de confirmación. Por favor, inicia el proceso de creación nuevamente.",
      );
    }

    const product = await createProductService(pending.payload as any);
    if (chatId) clearPendingAction(chatId);

    return `✅ Producto creado exitosamente:\n- ID: ${(product as any).id}\n- Nombre: ${(product as any).name}\n- Stock: ${(product as any).stock}\n- Costo: $${(product as any).costPrice}`;
  },
});
