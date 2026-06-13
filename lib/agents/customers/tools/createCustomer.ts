/**
 * Tool: createCustomer - Execute customer creation from draft
 *
 * Especificaciones relacionadas:
 * - /specs/features/ai-bot-ger.md (Confirmación Obligatoria)
 *
 * Alcance del test:
 * - Validación de creación desde draft
 * - Validación de limpieza de draft después de crear
 */

import { tool } from 'ai';
import { z } from 'zod';
import { createCustomer, type CreateCustomerInput } from '@/lib/services/customerService';
import { getPendingAction, clearPendingAction } from '../../utils/pendingActions';
import logger from '../../utils/logger';

export const createCustomerTool = tool({
  description: 'Ejecuta la creación de un cliente desde el draft guardado. Solo debe llamarse después de que el usuario confirma explícitamente.',
  inputSchema: z.object({
    chatId: z.string().describe('ID del chat para recuperar el draft'),
  }),
  execute: async ({ chatId }) => {
    logger.debug({ chatId }, 'Creating customer from draft');

    const pending = getPendingAction(chatId);

    if (!pending || pending.type !== 'create_customer') {
      return 'No hay un borrador de cliente pendiente de confirmación. Por favor, inicia el proceso de creación nuevamente.';
    }

    try {
      const input: CreateCustomerInput = {
        name: pending.payload.name as string,
        phone: pending.payload.phone as string | undefined,
        phoneAlt: pending.payload.phoneAlt as string | undefined,
        email: pending.payload.email as string | undefined,
        address: pending.payload.address as string | undefined,
        notes: pending.payload.notes as string | undefined,
        billingData: pending.payload.billingData as { cuit: string; invoiceType: string } | undefined,
      };

      const customer = await createCustomer(input);
      clearPendingAction(chatId);

      return `✅ Cliente creado exitosamente:\n- ID: ${customer.id}\n- Nombre: ${customer.name}\n- Balance: $${customer.balance}`;
    } catch (error) {
      logger.error({ chatId, error }, 'Failed to create customer');
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return `❌ Error al crear el cliente: ${message}`;
    }
  },
});
