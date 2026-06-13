/**
 * Tool: searchCustomers - Search for customers by name or phone
 *
 * Especificaciones relacionadas:
 * - /specs/features/customers.md
 *
 * Alcance del test:
 * - Validación de búsqueda por nombre
 * - Validación de búsqueda por teléfono
 * - Validación de formato de resultados
 */

import { tool } from 'ai';
import { z } from 'zod';
import { getCustomers } from '@/lib/services/customerService';
import logger from '../../utils/logger';

export const searchCustomersTool = tool({
  description: 'Busca clientes por nombre o teléfono. Devuelve una lista de clientes coincidentes.',
  inputSchema: z.object({
    search: z.string().describe('Término de búsqueda (nombre o teléfono)'),
    limit: z.number().optional().default(10).describe('Límite de resultados (default: 10)'),
  }),
  execute: async ({ search, limit }) => {
    logger.debug({ search, limit }, 'Searching customers');

    const result = await getCustomers({ search, limit });

    if (result.customers.length === 0) {
      return 'No se encontraron clientes con ese criterio de búsqueda.';
    }

    const formatted = result.customers
      .map((c) => {
        let line = `- ${c.name}`;
        if (c.phone) line += ` | Tel: ${c.phone}`;
        if (c.email) line += ` | Email: ${c.email}`;
        return line;
      })
      .join('\n');

    return `Se encontraron ${result.customers.length} cliente(s):\n${formatted}`;
  },
});
