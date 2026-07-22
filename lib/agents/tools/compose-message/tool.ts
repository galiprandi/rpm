import { tool } from 'ai';
import { z } from 'zod';
import { db } from '@/lib/db';
import { workOrder } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const composeWhatsAppMessageTool = tool({
  description: 'Redacta un mensaje de WhatsApp para un cliente basándose en los datos de una OT. NO envía el mensaje, solo lo redacta para que el empleado lo copie y envíe. Tipos: "ready" (auto listo), "progress" (avance del trabajo), "payment_reminder" (recordatorio de pago).',
  inputSchema: z.object({
    workOrderId: z.string().describe('ID de la orden de trabajo'),
    messageType: z.enum(['ready', 'progress', 'payment_reminder']).describe('Tipo de mensaje: "ready" (auto listo), "progress" (avance del trabajo), "payment_reminder" (recordatorio de pago)'),
    customNote: z.string().optional().describe('Nota adicional para incluir en el mensaje'),
  }),
  execute: async ({ workOrderId, messageType, customNote }) => {
    const wo = await db.query.workOrder.findFirst({
      where: eq(workOrder.id, workOrderId),
      with: {
        customer: true,
        vehicle: {
          with: {
            vehicleMake: true,
            vehicleModel: true,
          },
        },
        workOrderItems: {
          with: {
            product: true,
            service: true,
          },
        },
        payments: true,
      },
    });

    if (!wo) return 'OT no encontrada.';

    const customerName = wo.customer?.name || 'cliente';
    const vehicleDesc = wo.vehicle
      ? `${wo.vehicle.vehicleMake?.name || ''} ${wo.vehicle.vehicleModel?.name || ''} (${wo.vehicle.identifier || ''})`.trim()
      : 'su vehículo';
    const total = Number(wo.total);
    const totalPaid = wo.payments.reduce((s, p) => s + Number(p.amount), 0);
    const balance = total - totalPaid;
    const itemsList = wo.workOrderItems
      .map((i) => `  - ${i.type === 'PRODUCT' ? i.product?.name : i.service?.name} x${i.quantity}`)
      .join('\n');

    let message = '';

    switch (messageType) {
      case 'ready':
        message = `Hola ${customerName}, te avisamos que tu ${vehicleDesc} está listo para retirar 🚗✅`;
        if (balance > 0) {
          message += `\n\nEl importe a abonar es de $${balance.toLocaleString('es-AR')}`;
        }
        if (itemsList) {
          message += `\n\nTrabajos realizados:\n${itemsList}`;
        }
        message += `\n\nPodés pasar a retirarlo cuando quieras. ¡Gracias por elegirnos!`;
        break;

      case 'progress':
        message = `Hola ${customerName}, te informamos el estado de tu ${vehicleDesc} 🔧`;
        message += `\nEstado actual: ${wo.status}`;
        if (itemsList) {
          message += `\n\nTrabajos en proceso:\n${itemsList}`;
        }
        message += `\n\nTe avisaremos cuando esté listo para retirar.`;
        break;

      case 'payment_reminder':
        message = `Hola ${customerName}, te recordamos que tenés un saldo pendiente de $${balance.toLocaleString('es-AR')} por los trabajos realizados en tu ${vehicleDesc}.`;
        if (itemsList) {
          message += `\n\nTrabajos:\n${itemsList}`;
        }
        message += `\n\nPodés acercarte a abonar cuando te quede cómodo. ¡Gracias!`;
        break;
    }

    if (customNote) {
      message += `\n\nNota: ${customNote}`;
    }

    const phone = wo.customer?.phone || '';
    const phoneInfo = phone ? `\n\n📞 Teléfono: ${phone}` : '\n\n⚠️ El cliente no tiene teléfono registrado';

    return `📲 Mensaje para WhatsApp:\n\n${message}${phoneInfo}`;
  },
});
