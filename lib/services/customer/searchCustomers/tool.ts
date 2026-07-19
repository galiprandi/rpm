import { createTool } from '@/lib/agents/utils/createTool';
import { searchCustomersService } from './service';
import { searchCustomersSchema } from './schema';
import logger from '@/lib/agents/utils/logger';

/**
 * searchCustomersTool - Search for customers by name or phone
 *
 * Uses the createTool factory with the searchCustomersService.
 */
export const searchCustomersTool = createTool({
  name: 'searchCustomers',
  description: 'Busca clientes por nombre o teléfono. Devuelve ID, nombre, teléfono y email de cada cliente coincidente. Usar antes de crear una OT, venta o registrar un vehículo.',
  schema: searchCustomersSchema,
  service: async (input) => {
    const { search, limit } = input;
    logger.debug({ search, limit }, 'Searching customers');
    return searchCustomersService(input);
  },
  format: (result) => {
    const customers = result as any[];
    if (customers.length === 0) {
      return 'No se encontraron clientes con ese criterio de búsqueda.';
    }

    const formatted = customers
      .map((c) => {
        let line = `- ${c.name}`;
        if (c.phone) line += ` | Tel: ${c.phone}`;
        if (c.email) line += ` | Email: ${c.email}`;
        return line;
      })
      .join('\n');

    return `Se encontraron ${customers.length} cliente(s):\n${formatted}`;
  },
});
