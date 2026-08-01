import { tool } from "ai";
import { z } from "zod";
import { searchServicesService } from "./service";

export const searchServicesTool = tool({
  description:
    "Busca servicios del taller por nombre o descripción (ej: alineación, balanceo, instalación, etc.). Devuelve ID, nombre, descripción, costo base y duración aproximada en minutos. Usar cuando el usuario pregunte por servicios disponibles, sus costos o tiempos de mano de obra.",
  inputSchema: z.object({
    search: z
      .string()
      .describe("Término de búsqueda: nombre del servicio o descripción"),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("Cantidad máxima de resultados (default: 10)"),
  }),
  execute: async ({ search, limit }) => {
    const services = await searchServicesService(search, limit);

    if (services.length === 0) {
      return "No se encontraron servicios con ese criterio de búsqueda.";
    }

    const formatted = services
      .map((s) => {
        const descStr = s.description ? `\n  📝 ${s.description}` : "";
        return `- [ID: ${s.id}] ${s.name}${descStr}\n  💵 Costo Base: $${s.baseCost.toLocaleString("es-AR")}\n  ⏱️ Duración: ${s.timeMinutes} minutos`;
      })
      .join("\n\n");

    return `Se encontraron ${services.length} servicio(s):\n\n${formatted}`;
  },
});
