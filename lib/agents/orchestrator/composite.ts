import { tool } from 'ai';
import { z } from 'zod';
import { createCustomerService } from '@/lib/services/customer';
import { createVehicleService } from '@/lib/services/vehicle';
import { vehicleCategories } from '@/lib/services/vehicle';
import logger from '../utils/logger';

const validCategories = [...vehicleCategories] as const;

export const registerCustomerWithVehicle = tool({
  description: 'CREA un nuevo cliente Y registra su vehículo en UNA sola operación. Usar cuando el usuario quiere dar de alta un cliente nuevo con su vehículo.',
  inputSchema: z.object({
    customerName: z.string().describe('Nombre completo del cliente'),
    identifier: z.string().describe('Patente o identificador del vehículo'),
    category: z.enum(validCategories).describe('Categoría del vehículo'),
    customerPhone: z.string().optional().describe('Teléfono del cliente'),
    customerEmail: z.string().optional().describe('Email del cliente'),
    customerAddress: z.string().optional().describe('Dirección del cliente'),
    customerCuit: z.string().optional().describe('CUIT del cliente'),
    year: z.coerce.number().optional().describe('Año del vehículo'),
    color: z.string().optional().describe('Color del vehículo'),
    notes: z.string().optional().describe('Notas adicionales'),
  }),
  execute: async (input) => {
    logger.debug({ customerName: input.customerName, identifier: input.identifier }, 'Composite: registerCustomerWithVehicle');

    try {
      const customer = await createCustomerService({
        name: input.customerName,
        phone: input.customerPhone,
        email: input.customerEmail,
        address: input.customerAddress,
        notes: input.notes,
      } as any);

      const vehicle = await createVehicleService({
        identifier: input.identifier,
        category: input.category as any,
        customerId: customer.id,
        year: input.year,
        color: input.color,
        notes: input.notes,
      });

      return `✅ Cliente y vehículo creados exitosamente:\n\n📋 Cliente: ${customer.name} (ID: ${customer.id})\n🚗 Vehículo: ${vehicle.identifier} - ${vehicle.category} (ID: ${vehicle.id})`;
    } catch (error) {
      logger.error({ error }, 'Composite: registerCustomerWithVehicle failed');
      return `Error al crear cliente y vehículo: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
});

export const closeCashRegister = tool({
  description: 'CIERRA la caja del día. Solo debe llamarse cuando el usuario pide explícitamente cerrar la caja.',
  inputSchema: z.object({
    notes: z.string().optional().describe('Notas opcionales para el cierre'),
  }),
  execute: async () => {
    return 'Función de cierre de caja próximamente. Por ahora, cerrala manualmente desde el panel de Caja.';
  },
});

export const compositeTools = {
  registerCustomerWithVehicle,
  closeCashRegister,
};
