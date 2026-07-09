import { formatARS } from './format';

/**
 * Utility for generating WhatsApp notification links
 */

interface NotificationData {
  customerName: string;
  vehicleIdentifier: string;
  status: string;
  total: number;
  totalPaid: number;
}

/**
 * Generates a WhatsApp link with a pre-filled message
 * @param phone - Customer phone number
 * @param message - Message text
 * @returns WhatsApp URL
 */
export function getWhatsAppLink(phone: string, message: string): string {
  // Remove non-numeric characters from phone
  let cleanPhone = phone.replace(/\D/g, '');

  // Basic Argentinian phone number normalization
  // If it has 10 digits (e.g. 11 1234 5678) and no country code, add 549 prefix
  if (cleanPhone.length === 10) {
    cleanPhone = `549${cleanPhone}`;
  }
  // If it has 11 digits and starts with 15 (Argentinian mobile notation), convert to 549 + 10 digits
  else if (cleanPhone.length === 11 && cleanPhone.startsWith('15')) {
    cleanPhone = `549${cleanPhone.substring(2)}`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates a status notification message for Work Orders
 * @param data - Work Order data for the message
 * @returns Formatted message string
 */
export function getWorkOrderMessage(data: NotificationData): string {
  const { customerName, vehicleIdentifier, status, total, totalPaid } = data;
  const balance = Math.max(0, total - totalPaid);

  const greeting = `Hola ${customerName}!`;
  let statusMessage = '';

  if (status === 'READY') {
    statusMessage = `Te avisamos que tu vehículo *${vehicleIdentifier}* ya está listo para retirar en *RPM Accesorios*. 🚀`;
  } else if (status === 'DELIVERED') {
    statusMessage = `Gracias por confiar en *RPM Accesorios* para el servicio de tu vehículo *${vehicleIdentifier}*. ¡Que lo disfrutes! 😊`;
  } else {
    statusMessage = `Te escribimos por la Orden de Trabajo de tu vehículo *${vehicleIdentifier}*.`;
  }

  const balanceMessage = balance > 0
    ? `\n\nSaldo pendiente: *${formatARS(balance)}*`
    : '\n\nLa orden se encuentra totalmente abonada.';

  return `${greeting}\n\n${statusMessage}${balanceMessage}\n\nQuedamos a tu disposición.`;
}

/**
 * Generates a debt reminder message for customers with outstanding balance
 * @param customerName - Name of the customer
 * @param balance - Outstanding balance
 * @returns Formatted message string
 */
export function getDebtReminderMessage(customerName: string, balance: number): string {
  const greeting = `Hola ${customerName}!`;
  const message = `Te escribimos de *RPM Accesorios* para recordarte que tenés un saldo pendiente de *${formatARS(balance)}* en tu cuenta corriente.`;
  const footer = `Cualquier duda quedamos a tu disposición. ¡Muchas gracias!`;

  return `${greeting}\n\n${message}\n\n${footer}`;
}
