import { tool } from 'ai';
import { createCustomerService } from './service';
import { createCustomerSchema } from './schema';
import logger from '@/lib/agents/utils/logger';

/**
 * createCustomerTool - Create a new customer directly.
 *
 * Confirmation is handled by prompt (the model must ask the user before calling).
 */
export const createCustomerTool = tool({
  description:
    'Crea un nuevo cliente. Requiere nombre. Opcionalmente teléfono, email, dirección, notas y datos de facturación (CUIT + tipo de factura). Debe llamarse solo después de que el usuario confirma explícitamente.',
  inputSchema: createCustomerSchema,
  execute: async (input) => {
    logger.debug({ name: input.name }, 'Creating customer');

    try {
      const customer = await createCustomerService(input);
      return `✅ Cliente creado exitosamente:\n- ID: ${customer.id}\n- Nombre: ${customer.name}\n- Balance: $${(customer as any).balance || 0}`;
    } catch (error) {
      logger.error({ error }, 'Error creating customer');
      return `Error al crear cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  },
});
