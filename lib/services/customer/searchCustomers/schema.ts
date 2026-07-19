import { z } from 'zod';

/**
 * Schema for searching customers
 *
 * This schema is shared between:
 * - API routes (app/api/customers/route.ts)
 * - AI tools (lib/services/customer/searchCustomers/tool.ts)
 * - Direct service calls
 */
export const searchCustomersSchema = z.object({
  search: z.string().describe('Término de búsqueda: nombre o teléfono del cliente'),
  limit: z.number().optional().default(10).describe('Cantidad máxima de resultados (default: 10)'),
});

export type SearchCustomersInput = z.infer<typeof searchCustomersSchema>;
