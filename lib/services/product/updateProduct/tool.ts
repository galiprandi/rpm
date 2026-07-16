import { tool } from "ai";
import { z } from "zod";
import { updateProductService } from "./service";
import { updateProductSchema } from "./schema";
import {
  getPendingAction,
  clearPendingAction,
  savePendingAction,
} from "@/lib/agents/utils/pendingActions";
import logger from "@/lib/agents/utils/logger";

/**
 * draftUpdateProductTool - Save a product update draft for confirmation
 *
 * Only organizational fields: name, category, location, description, sku, barcode.
 * Does NOT allow stock, cost, or replacement cost changes.
 */
export const draftUpdateProductTool = tool({
  description:
    "Guarda un borrador de actualización de producto para confirmación. Solo permite cambiar name, categoryId, location, description, sku y barcode (EAN). NO permite cambiar stock, costos ni estado. Debe llamarse antes de ejecutar la actualización.",
  inputSchema: updateProductSchema.extend({
    chatId: z.string().describe("ID del chat para persistir el draft"),
  }),
  execute: async (input) => {
    const {
      chatId,
      productId,
      name,
      categoryId,
      location,
      description,
      sku,
      barcode,
    } = input as {
      chatId: string;
      productId: string;
      name?: string;
      categoryId?: string;
      location?: string;
      description?: string;
      sku?: string;
      barcode?: string;
    };

    logger.debug({ chatId, productId }, "Drafting product update");

    const changes: string[] = [];
    if (name !== undefined) changes.push(`Nombre: ${name}`);
    if (categoryId !== undefined) changes.push(`Categoría ID: ${categoryId}`);
    if (location !== undefined)
      changes.push(`Ubicación: ${location || "(vacío)"}`);
    if (description !== undefined)
      changes.push(`Descripción: ${description || "(vacía)"}`);
    if (sku !== undefined) changes.push(`SKU: ${sku || "(vacío)"}`);
    if (barcode !== undefined) changes.push(`EAN: ${barcode || "(vacío)"}`);

    if (changes.length === 0) {
      return "No se especificaron campos para actualizar. Los campos permitidos son: name, categoryId, location, description, sku, barcode.";
    }

    const payload: Record<string, unknown> = { productId };
    if (name !== undefined) payload.name = name;
    if (categoryId !== undefined) payload.categoryId = categoryId;
    if (location !== undefined) payload.location = location;
    if (description !== undefined) payload.description = description;
    if (sku !== undefined) payload.sku = sku;
    if (barcode !== undefined) payload.barcode = barcode;

    const summary = `Producto ID: ${productId}\nCambios:\n${changes.map((c) => `  - ${c}`).join("\n")}`;

    savePendingAction(chatId, {
      type: "update_product",
      payload,
      summary,
    });

    return `Borrador guardado. Resumen:\n${summary}\n\n¿Confirmas actualizar este producto?`;
  },
});

/**
 * updateProductTool - Execute product update from draft
 *
 * Only organizational fields. No stock, cost, or sensitive data.
 */
export const updateProductTool = tool({
  description:
    "Ejecuta la actualización de un producto desde el borrador guardado. Solo debe llamarse después de que el usuario confirma explícitamente.",
  inputSchema: z.object({
    chatId: z.string().describe("ID del chat para recuperar el draft"),
  }),
  execute: async (input) => {
    const { chatId } = input as { chatId: string };

    logger.debug({ chatId }, "Updating product from draft");

    const pending = getPendingAction(chatId);

    if (!pending || pending.type !== "update_product") {
      throw new Error(
        "No hay un borrador de actualización pendiente. Por favor, iniciá el proceso de actualización nuevamente.",
      );
    }

    const product = await updateProductService(pending.payload as any);
    clearPendingAction(chatId);

    return `✅ Producto actualizado exitosamente:\n- ID: ${(product as any).id}\n- Nombre: ${(product as any).name}\n- Categoría: ${(product as any).category?.name || "N/A"}\n- SKU: ${(product as any).sku || "N/A"}\n- EAN: ${(product as any).barcode || "N/A"}`;
  },
});
