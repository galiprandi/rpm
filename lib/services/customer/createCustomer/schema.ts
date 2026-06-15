import { z } from 'zod';

/**
 * Schema for creating a customer
 *
 * This schema is shared between:
 * - API routes (app/api/customers/route.ts)
 * - Direct service calls
 */
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().optional(),
  phoneAlt: z.string().optional(),
  email: z.string().optional().refine(
    (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    'Email inválido'
  ),
  address: z.string().optional(),
  notes: z.string().optional(),
  billingData: z.object({
    cuit: z.string().min(11, 'CUIT debe tener 11 dígitos').max(11, 'CUIT debe tener 11 dígitos'),
    invoiceType: z.enum(['A', 'B', 'C', 'M']),
  }).optional(),
});

/**
 * Strict schema for AI tools - only allows name and chatId
 *
 * This prevents the AI from hallucinating optional parameters like phone, email, etc.
 * The AI should only collect the name initially; other fields can be added later.
 */
export const draftCustomerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  chatId: z.string().describe('ID del chat para persistir el draft'),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type DraftCustomerInput = z.infer<typeof draftCustomerSchema>;
