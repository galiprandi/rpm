import { tool } from 'ai';
import { searchVehiclesSchema } from './schema';
import { searchVehiclesService } from './service';
import logger from '@/lib/agents/utils/logger';

export const searchVehiclesTool = tool({
  description:
    'Busca vehículos por patente/identificador, nombre de cliente o ID de cliente. Devuelve ID, patente, categoría, marca, modelo, año, color y datos del cliente. Usar cuando el usuario pregunte por un vehículo o quiera crear una OT.',
  inputSchema: searchVehiclesSchema,
  execute: async (input) => {
    logger.debug({ identifier: input.identifier, customerName: input.customerName }, 'Searching vehicles');

    const vehicles = await searchVehiclesService(input);

    if (vehicles.length === 0) {
      return 'No se encontraron vehículos con ese criterio de búsqueda.';
    }

    const formatted = vehicles
      .map((v) => {
        const makeModel = [v.vehicle_make?.name, v.vehicle_model?.name]
          .filter(Boolean)
          .join(' ');
        const yearStr = v.year ? ` ${v.year}` : '';
        const colorStr = v.color ? `, ${v.color}` : '';

        let line = `- [ID: ${v.id}] ${v.identifier} (${v.category})`;
        if (makeModel) line += `\n  Vehículo: ${makeModel}${yearStr}${colorStr}`;
        line += `\n  Cliente: ${v.customer.name} (ID: ${v.customer.id})`;
        if (v.customer.phone) line += ` | Tel: ${v.customer.phone}`;

        return line;
      })
      .join('\n\n');

    return `Se encontraron ${vehicles.length} vehículo(s):\n\n${formatted}`;
  },
});
