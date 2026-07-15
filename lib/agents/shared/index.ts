import { tool } from 'ai';
import { z } from 'zod';
import { searchProductsService } from '@/lib/services/product';
import { searchCustomersService } from '@/lib/services/customer';
import logger from '../utils/logger';

export const sharedSearchProducts = tool({
  description: 'Busca productos por nombre o SKU. Útil para consultar stock, precios o encontrar un producto para agregar a una orden.',
  inputSchema: z.object({
    search: z.string().describe('Término de búsqueda (nombre o SKU)'),
    limit: z.number().optional().describe('Cantidad máxima de resultados (default 10)'),
  }),
  execute: async ({ search, limit }) => {
    logger.debug({ search }, 'Shared search products');
    const results = await searchProductsService({ search, limit: limit ?? 10 });
    if (results.length === 0) return 'No se encontraron productos.';
    return results.map((p: any) =>
      `🔹 ${p.name}${p.sku ? ` (SKU: ${p.sku})` : ''} - Stock: ${p.stock} - $${p.costPrice}`
    ).join('\n') + `\n\n${results.length} producto(s) encontrado(s).`;
  },
});

export const sharedSearchCustomers = tool({
  description: 'Busca clientes por nombre, teléfono o email. Útil para encontrar un cliente antes de crear una OT, venta o vehículo.',
  inputSchema: z.object({
    search: z.string().describe('Término de búsqueda (nombre, teléfono o email)'),
    limit: z.number().optional().describe('Cantidad máxima de resultados (default 10)'),
  }),
  execute: async ({ search, limit }) => {
    logger.debug({ search }, 'Shared search customers');
    const results = await searchCustomersService({ search, limit: limit ?? 10 });
    if (results.length === 0) return 'No se encontraron clientes.';
    return results.map((c: any) =>
      `🔹 ${c.name}${c.phone ? ` - 📞 ${c.phone}` : ''}${c.email ? ` - ✉️ ${c.email}` : ''} | ID: ${c.id}`
    ).join('\n') + `\n\n${results.length} cliente(s) encontrado(s).`;
  },
});

export const sharedSearchWorkOrders = tool({
  description: 'Busca órdenes de trabajo por ID, cliente o estado.',
  inputSchema: z.object({
    search: z.string().optional().describe('Término de búsqueda (ID de OT, nombre de cliente)'),
    status: z.string().optional().describe('Filtrar por estado'),
    limit: z.number().optional().describe('Cantidad máxima de resultados (default 10)'),
  }),
  execute: async ({ search, status, limit }) => {
    logger.debug({ search, status }, 'Shared search work orders (stub)');
    return 'Función de búsqueda de OT próximamente.';
  },
});

export const sharedTools = {
  searchProducts: sharedSearchProducts,
  searchCustomers: sharedSearchCustomers,
  searchWorkOrders: sharedSearchWorkOrders,
};
