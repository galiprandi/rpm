import { tool } from "ai";
import { z } from "zod";
import { searchProductsWithPricesService } from "./service";

export const searchProductsWithPricesTool = tool({
  description:
    "Busca productos por nombre, SKU o código de barras. Devuelve ID, nombre, categoría, stock disponible, precio de contado y precio con tarjeta. Usar cuando el usuario pregunte por productos, stock o precios.",
  inputSchema: z.object({
    search: z
      .string()
      .describe("Término de búsqueda: nombre del producto, SKU o código de barras"),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("Cantidad máxima de resultados (default: 10)"),
  }),
  execute: async ({ search, limit }) => {
    const products = await searchProductsWithPricesService(search, limit);

    if (products.length === 0) {
      return "No se encontraron productos con ese criterio de búsqueda.";
    }

    const formatted = products
      .map((p) => {
        const stockStatus =
          p.stock <= 0
            ? "❌ Sin stock"
            : p.stock <= p.minStock
              ? `⚠️ Stock bajo: ${p.stock} (mín: ${p.minStock})`
              : `✅ Stock: ${p.stock}`;

        const contado =
          p.contadoPrice != null
            ? `$${p.contadoPrice.toLocaleString("es-AR")}`
            : "N/A";
        const tarjeta =
          p.tarjetaPrice != null
            ? `$${p.tarjetaPrice.toLocaleString("es-AR")}`
            : "N/A";

        return `- [ID: ${p.id}] ${p.name} (${p.categoryName})\n  ${stockStatus}\n  Contado: ${contado} | Tarjeta: ${tarjeta}`;
      })
      .join("\n\n");

    return `Se encontraron ${products.length} producto(s):\n\n${formatted}`;
  },
});
