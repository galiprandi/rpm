import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { capitalizeText } from '@/lib/utils/format';
import type { CreateCustomerInput } from './schema';

/**
 * createCustomerService - Pure function to create a customer
 *
 * This service is shared between:
 * - API routes (app/api/customers/route.ts)
 * - AI tools (lib/services/customer/createCustomer/tool.ts)
 *
 * @param input - Customer creation data
 * @returns Created customer object
 */
export async function createCustomerService(input: CreateCustomerInput) {
  const { name, phone, phoneAlt, email, address, notes, billingData } = input;

  // Validate required fields
  if (!name) {
    throw new Error('Missing required field: name');
  }

  // Validate billingData if provided
  if (billingData) {
    if (!billingData.cuit || !billingData.invoiceType) {
      throw new Error('billingData requires cuit and invoiceType');
    }
    const validInvoiceTypes = ['A', 'B', 'C', 'M'];
    if (!validInvoiceTypes.includes(billingData.invoiceType)) {
      throw new Error('Invalid invoiceType. Must be A, B, C, or M');
    }
  }

  const customer = await prisma.customer.create({
    data: {
      id: randomUUID(),
      name: capitalizeText(name) || name,
      phone,
      phoneAlt,
      email,
      address,
      notes,
      billingData: billingData as any || null,
      updatedAt: new Date(),
    },
  });

  return customer;
}
