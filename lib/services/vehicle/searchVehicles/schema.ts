import { z } from 'zod';

export const searchVehiclesSchema = z.object({
  identifier: z
    .string()
    .optional()
    .describe('Patente o identificador del vehículo (búsqueda parcial)'),
  customerName: z
    .string()
    .optional()
    .describe('Nombre del cliente (búsqueda parcial, ej: "Aliprandi")'),
  customerId: z.string().optional().describe('ID del cliente'),
  limit: z
    .number()
    .optional()
    .default(10)
    .describe('Cantidad máxima de resultados (default: 10)'),
});

export type SearchVehiclesInput = z.infer<typeof searchVehiclesSchema>;
