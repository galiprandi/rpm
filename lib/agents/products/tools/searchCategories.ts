/**
 * Tool: searchCategories - Search for product categories
 *
 * Especificaciones relacionadas:
 * - /specs/features/products-and-inventory.md
 *
 * Alcance del test:
 * - Validación de búsqueda por nombre
 * - Validación de formato de resultados
 */

import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import logger from '../../utils/logger';

export const searchCategoriesTool = tool({
  description: 'Busca categorías de productos por nombre. Devuelve una lista de categorías con sus IDs.',
  inputSchema: z.object({
    search: z.string().describe('Término de búsqueda (nombre de categoría)'),
    limit: z.number().optional().default(10).describe('Límite de resultados (default: 10)'),
  }),
  execute: async ({ search, limit }) => {
    logger.debug({ search, limit }, 'Searching categories');

    const categories = await prisma.category.findMany({
      where: {
        name: { contains: search, mode: 'insensitive' },
      },
      take: limit,
    });

    if (categories.length === 0) {
      return 'No se encontraron categorías con ese criterio de búsqueda.';
    }

    const formatted = categories
      .map((c: { id: string; name: string }) => `- ${c.name} (ID: ${c.id})`)
      .join('\n');

    return `Se encontraron ${categories.length} categoría(s):\n${formatted}`;
  },
});
