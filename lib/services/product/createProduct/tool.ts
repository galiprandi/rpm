import { tool } from "ai";
import { createProductService } from "./service";
import { createProductSchema } from "./schema";
import logger from "@/lib/agents/utils/logger";

/**
 * createProductTool - Create a new product directly.
 *
 * Confirmation is handled by prompt (the model must ask the user before calling).
 */
export const createProductTool = tool({
  description:
    "Crea un nuevo producto. Requiere nombre, ID de categoría, precio de costo y stock. Opcionalmente SKU, código de barras (EAN), precio de reemplazo, stock mínimo, ID de proveedor, ubicación y descripción. Debe llamarse solo después de que el usuario confirma explícitamente.",
  inputSchema: createProductSchema,
  execute: async (input) => {
    logger.debug({ name: input.name }, "Creating product");

    try {
      const product = await createProductService(input);
      return `✅ Producto creado exitosamente:\n- ID: ${(product as any).id}\n- Nombre: ${(product as any).name}\n- Categoría: ${(product as any).category?.name || "N/A"}\n- Stock: ${(product as any).stock}\n- Costo: $${(product as any).costPrice}`;
    } catch (error) {
      logger.error({ error }, "Error creating product");
      return `Error al crear producto: ${error instanceof Error ? error.message : "Error desconocido"}`;
    }
  },
});
