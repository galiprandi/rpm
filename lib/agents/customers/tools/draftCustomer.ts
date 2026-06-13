/**
 * Tool: draftCustomer - Save a customer draft for confirmation
 *
 * Especificaciones relacionadas:
 * - /specs/features/ai-bot-ger.md (Confirmación Obligatoria)
 *
 * Alcance del test:
 * - Validación de guardado de draft
 * - Validación de generación de resumen
 */

import { tool } from 'ai';
import { z } from 'zod';
import { savePendingAction } from '../../utils/pendingActions';
import logger from '../../utils/logger';

export const draftCustomerTool = tool({
  description: 'Guarda un borrador de cliente para confirmación. Debe llamarse antes de crear el cliente para mostrar un resumen al usuario.',
  inputSchema: z.object({
    name: z.string().describe('Nombre del cliente (obligatorio)'),
    phone: z.string().optional().describe('Teléfono del cliente (opcional)'),
    phoneAlt: z.string().optional().describe('Teléfono alternativo (opcional)'),
    email: z.string().optional().describe('Email del cliente (opcional)'),
    address: z.string().optional().describe('Dirección del cliente (opcional)'),
    notes: z.string().optional().describe('Notas adicionales (opcional)'),
    cuit: z.string().optional().describe('CUIT para facturación (opcional)'),
    invoiceType: z.enum(['A', 'B', 'C', 'M']).optional().describe('Tipo de factura (A/B/C/M)'),
    chatId: z.string().describe('ID del chat para persistir el draft'),
  }),
  execute: async ({ name, phone, phoneAlt, email, address, notes, cuit, invoiceType, chatId }) => {
    logger.debug({ chatId, name }, 'Drafting customer');

    const payload: Record<string, unknown> = {
      name,
      ...(phone && { phone }),
      ...(phoneAlt && { phoneAlt }),
      ...(email && { email }),
      ...(address && { address }),
      ...(notes && { notes }),
      ...(cuit && { billingData: { cuit, invoiceType } }),
    };

    const summary = `Cliente: ${name}${phone ? `\nTeléfono: ${phone}` : ''}${email ? `\nEmail: ${email}` : ''}${address ? `\nDirección: ${address}` : ''}${cuit ? `\nCUIT: ${cuit} (${invoiceType})` : ''}`;

    savePendingAction(chatId, {
      type: 'create_customer',
      payload,
      summary,
    });

    return `Borrador guardado. Resumen:\n${summary}\n\n¿Confirmas crear este cliente?`;
  },
});
