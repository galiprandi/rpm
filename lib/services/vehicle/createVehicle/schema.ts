import { z } from 'zod';

export const vehicleCategories = [
  'CAR', 'TRUCK', 'SUV', 'PICKUP', 'MOTORCYCLE',
  'TRAILER', 'AUDIO_EQUIPMENT', 'ELECTRIC_SCOOTER', 'OTHER',
] as const;

export const createVehicleSchema = z.object({
  identifier: z.string().describe('Patente o identificador del vehículo'),
  category: z.enum(vehicleCategories).describe('Categoría del vehículo'),
  customerId: z.string().describe('ID del cliente propietario'),
  makeId: z.string().optional().describe('ID de la marca'),
  modelId: z.string().optional().describe('ID del modelo'),
  year: z.coerce.number().optional().describe('Año'),
  color: z.string().optional().describe('Color'),
  equipmentName: z.string().optional().describe('Nombre del equipo'),
  equipmentType: z.string().optional().describe('Tipo de equipo'),
  description: z.string().optional().describe('Descripción'),
  notes: z.string().optional().describe('Notas'),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
