import { tool } from 'ai';
import { searchCustomersSchema } from './schema';
import { searchCustomersService } from './service';
import logger from '@/lib/agents/utils/logger';

/**
 * searchCustomersTool - Search customers by name, phone, email, address, or vehicle plate.
 */
export const searchCustomersTool = tool({
  description:
    'Busca clientes por nombre, teléfono, email, dirección o patente de su vehículo. Devuelve ID, nombre, contacto y vehículos asociados. Usar antes de crear una OT, venta o registrar un vehículo.',
  inputSchema: searchCustomersSchema,
  execute: async (input) => {
    logger.debug({ search: input.search }, 'Searching customers');

    const customers = await searchCustomersService(input);

    if (customers.length === 0) {
      return 'No se encontraron clientes con ese criterio de búsqueda.';
    }

    const formatted = customers
      .map((c) => {
        let line = `- [ID: ${c.id}] ${c.name}`;
        if (c.phone) line += ` | Tel: ${c.phone}`;
        if (c.email) line += ` | Email: ${c.email}`;
        if (c.vehicles && c.vehicles.length > 0) {
          const vehicles = c.vehicles
            .map((v: { identifier: string; category: string }) => `${v.identifier} (${v.category})`)
            .join(', ');
          line += `\n  Vehículos: ${vehicles}`;
        }
        return line;
      })
      .join('\n\n');

    return `Se encontraron ${customers.length} cliente(s):\n\n${formatted}`;
  },
});
