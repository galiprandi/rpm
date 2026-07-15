import { tool } from 'ai';
import { createVehicleService } from './service';
import { createVehicleSchema } from './schema';
import logger from '@/lib/agents/utils/logger';

export const registerVehicleTool = tool({
  description: 'Registra un vehículo para un cliente existente. Requiere el ID del cliente, la patente/identificador y la categoría.',
  inputSchema: createVehicleSchema,
  execute: async (input) => {
    logger.debug({ identifier: input.identifier, customerId: input.customerId }, 'Registering vehicle');

    try {
      const vehicle = await createVehicleService(input as any);
      return `✅ Vehículo registrado:\n- ID: ${vehicle.id}\n- Patente: ${vehicle.identifier}\n- Categoría: ${vehicle.category}\n- Cliente: ${(vehicle as any).customer?.name || input.customerId}`;
    } catch (error) {
      logger.error({ error }, 'Error registering vehicle');
      return `Error al registrar vehículo: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
});
