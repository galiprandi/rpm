/**
 * Tool: searchSuppliers - Search for suppliers
 *
 * Especificaciones relacionadas:
 * - /specs/features/suppliers.md
 *
 * Alcance del test:
 * - Validación de búsqueda por nombre
 * - Validación de formato de resultados
 */

import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import logger from '../../utils/logger';

export const searchSuppliersTool = tool({
  description: 'Busca proveedores por nombre. Devuelve una lista de proveedores con sus IDs.',
  inputSchema: z.object({
    search: z.string().describe('Término de búsqueda (nombre de proveedor)'),
    limit: z.number().optional().default(10).describe('Límite de resultados (default: 10)'),
  }),
  execute: async ({ search, limit }) => {
    logger.debug({ search, limit }, 'Searching suppliers');

    const suppliers = await prisma.supplier.findMany({
      where: {
        name: { contains: search, mode: 'insensitive' },
      },
      take: limit,
    });

    if (suppliers.length === 0) {
      return 'No se encontraron proveedores con ese criterio de búsqueda.';
    }

    const formatted = suppliers
      .map((s: { id: string; name: string }) => `- ${s.name} (ID: ${s.id})`)
      .join('\n');

    return `Se encontraron ${suppliers.length} proveedor(es):\n${formatted}`;
  },
});
