import { createTool } from '@/lib/agents/utils/createTool';
import { createCustomerService } from './service';
import { draftCustomerSchema } from './schema';
import { getPendingAction, clearPendingAction, savePendingAction } from '@/lib/agents/utils/pendingActions';
import logger from '@/lib/agents/utils/logger';
import { z } from 'zod';

/**
 * draftCustomerTool - Save a customer draft for confirmation
 *
 * Uses the strict draftCustomerSchema to prevent AI from hallucinating optional parameters.
 * Only name and chatId are allowed; other fields can be added later by the user.
 */
export const draftCustomerTool = createTool({
  name: 'draftCustomer',
  description: 'Guarda un borrador de cliente para confirmación. Debe llamarse antes de crear el cliente para mostrar un resumen al usuario.',
  schema: draftCustomerSchema,
  service: async (input) => {
    const { chatId, name } = input as {
      chatId: string;
      name: string;
    };

    logger.debug({ chatId, name }, 'Drafting customer');

    const payload: Record<string, unknown> = {
      name,
    };

    const summary = `Cliente: ${name}`;

    savePendingAction(chatId, {
      type: 'create_customer',
      payload,
      summary,
    });

    return `Borrador guardado. Resumen:\n${summary}\n\n¿Confirmas crear este cliente?`;
  },
});

/**
 * createCustomerTool - Execute customer creation from draft
 *
 * Uses the createTool factory with a custom service that retrieves the draft and executes creation.
 */
export const createCustomerTool = createTool({
  name: 'createCustomer',
  description: 'Ejecuta la creación de un cliente desde el draft guardado. Solo debe llamarse después de que el usuario confirma explícitamente.',
  schema: z.object({
    chatId: z.string().describe('ID del chat para recuperar el draft'),
  }),
  service: async (input) => {
    const { chatId } = input as { chatId: string };
    
    logger.debug({ chatId }, 'Creating customer from draft');

    const pending = getPendingAction(chatId);

    if (!pending || pending.type !== 'create_customer') {
      throw new Error('No hay un borrador de cliente pendiente de confirmación. Por favor, inicia el proceso de creación nuevamente.');
    }

    const customer = await createCustomerService(pending.payload as any);
    clearPendingAction(chatId);

    return customer;
  },
  format: (customer) => `✅ Cliente creado exitosamente:\n- ID: ${(customer as any).id}\n- Nombre: ${(customer as any).name}\n- Balance: $${(customer as any).balance || 0}`,
});
