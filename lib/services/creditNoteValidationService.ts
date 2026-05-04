/**
 * Credit Note Validation Service
 * Pure validation functions for credit notes
 */
import { prisma } from '@/lib/prisma';
import { isCashRegisterOpen } from './cashMovementService';

// Using 'any' for Prisma types because Prisma generates complex types with many fields
// that don't match simple interfaces. This is acceptable for validation logic.
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface CreditNoteItemInput {
  productId?: string;
  serviceId?: string;
  quantity: number;
}

export interface CreateCreditNoteInput {
  originalSaleId: string;
  originalSaleType: 'direct_sale' | 'work_order';
  items: CreditNoteItemInput[];
  refundMethod: 'CASH' | 'ACCOUNT_CREDIT';
  paymentMethodId?: string;
  paymentMethodCode?: string;
  notes?: string;
  createdBy: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export async function validateCreditNoteInput(input: CreateCreditNoteInput): Promise<ValidationResult> {
  const errors: string[] = [];

  // Validate required fields
  if (!input.originalSaleId) {
    errors.push('originalSaleId es requerido');
  }
  if (!input.originalSaleType) {
    errors.push('originalSaleType es requerido');
  }
  if (!input.items || input.items.length === 0) {
    errors.push('items es requerido y debe tener al menos un item');
  }

  // Validate originalSaleType
  if (input.originalSaleType && !['direct_sale', 'work_order'].includes(input.originalSaleType)) {
    errors.push('originalSaleType debe ser direct_sale o work_order');
  }

  // Validate refundMethod
  if (input.refundMethod && !['CASH', 'ACCOUNT_CREDIT'].includes(input.refundMethod)) {
    errors.push('refundMethod debe ser CASH o ACCOUNT_CREDIT');
  }

  // Validate items
  if (input.items) {
    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i];
      if (!item.productId && !item.serviceId) {
        errors.push(`Item ${i + 1}: debe tener productId o serviceId`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${i + 1}: quantity debe ser mayor a 0`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export async function validateOriginalSaleExists(
  originalSaleId: string,
  originalSaleType: 'direct_sale' | 'work_order'
): Promise<{ exists: boolean; customerId?: string;  
sale?: any }> {
  if (originalSaleType === 'direct_sale') {
    const sale = await prisma.direct_sale.findUnique({
      where: { id: originalSaleId },
      include: {
        items: { include: { product: { select: { name: true } }, service: { select: { name: true } } } },
        customer: true,
      },
    });
    return { exists: !!sale, customerId: sale?.customerId ?? undefined, sale: sale ?? undefined };
  }

  const sale = await prisma.work_order.findUnique({
    where: { id: originalSaleId },
    include: {
      work_order_item: { include: { product: { select: { name: true } }, service: { select: { name: true } } } },
      customer: true,
    },
  });
  return { exists: !!sale, customerId: sale?.customerId ?? undefined, sale: sale ?? undefined };
}

export async function validateCashRegisterOpen(): Promise<ValidationResult> {
  const isOpen = await isCashRegisterOpen();
  if (!isOpen) {
    return { valid: false, errors: ['La caja está cerrada. Debe abrir la caja para realizar reintegros en efectivo.'] };
  }
  return { valid: true, errors: [] };
}

export async function validatePaymentMethodForCash(paymentMethodId?: string): Promise<ValidationResult> {
  if (!paymentMethodId) {
    return { valid: false, errors: ['Debe especificar el método de pago para reintegro en efectivo'] };
  }

  const paymentMethod = await prisma.payment_method.findUnique({
    where: { id: paymentMethodId },
  });

  if (!paymentMethod) {
    return { valid: false, errors: ['Método de pago no encontrado'] };
  }

  return { valid: true, errors: [] };
}

export async function validateItemsInOriginalSale(
  items: CreditNoteItemInput[],
  originalSaleType: 'direct_sale' | 'work_order',
   
  sale: any
): Promise<ValidationResult> {
  const errors: string[] = [];

  const originalItems = originalSaleType === 'direct_sale'
     
    ? sale.items.map((item: any) => ({
        productId: item.productId ?? undefined,
        serviceId: item.serviceId ?? undefined,
        quantity: item.quantity,
        name: item.name || item.product?.name || item.service?.name || 'Sin nombre',
      }))
     
    : sale.work_order_item.map((item: any) => ({
        productId: item.productId ?? undefined,
        serviceId: item.serviceId ?? undefined,
        quantity: item.quantity,
        name: item.product?.name || item.service?.name || 'Sin nombre',
      }));

  for (const itemInput of items) {
    const original = originalItems.find(
      (oi: { productId?: string; serviceId?: string }) =>
        (itemInput.productId && oi.productId === itemInput.productId) ||
        (itemInput.serviceId && oi.serviceId === itemInput.serviceId)
    );

    if (!original) {
      errors.push(`Item no encontrado en la venta original: ${itemInput.productId || itemInput.serviceId}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export async function getAlreadyReturnedQuantities(
  originalSaleId: string,
  originalSaleType: 'direct_sale' | 'work_order'
): Promise<Record<string, number>> {
  const creditNotes = await prisma.credit_note.findMany({
    where: {
      originalSaleId,
      originalSaleType,
      status: 'ISSUED',
    },
    include: { items: true },
  });

  const returned: Record<string, number> = {};
  for (const cn of creditNotes) {
    for (const item of cn.items) {
      const key = item.productId || item.serviceId || item.id;
      if (!key) {
        console.warn('[CreditNoteValidation] Item without productId, serviceId or id - skipping quantity tracking', item);
        continue;
      }
      returned[key] = (returned[key] || 0) + item.quantity;
    }
  }
  return returned;
}

export async function validateReturnQuantities(
  items: CreditNoteItemInput[],
  originalSaleType: 'direct_sale' | 'work_order',
   
  sale: any
): Promise<ValidationResult> {
  const errors: string[] = [];

  const originalItems = originalSaleType === 'direct_sale'
     
    ? sale.items.map((item: any) => ({
        id: item.id,
        productId: item.productId ?? undefined,
        serviceId: item.serviceId ?? undefined,
        quantity: item.quantity,
        name: item.product?.name || item.service?.name || 'Sin nombre',
      }))
     
    : sale.work_order_item.map((item: any) => ({
        id: item.id,
        productId: item.productId ?? undefined,
        serviceId: item.serviceId ?? undefined,
        quantity: item.quantity,
        name: item.product?.name || item.service?.name || 'Sin nombre',
      }));

  const returnedQty = await getAlreadyReturnedQuantities(sale.id, originalSaleType);

  for (const itemInput of items) {
    const original = originalItems.find(
      (oi: { productId?: string; serviceId?: string; id?: string }) =>
        (itemInput.productId && oi.productId === itemInput.productId) ||
        (itemInput.serviceId && oi.serviceId === itemInput.serviceId)
    );

    if (!original) {
      errors.push(`Item no encontrado en la venta original`);
      continue;
    }

    const key = original.productId || original.serviceId || original.id;
    if (!key) {
      errors.push(`Item sin identificador: ${original.name}`);
      continue;
    }

    const alreadyReturned = returnedQty[key] || 0;
    const remaining = original.quantity - alreadyReturned;

    if (itemInput.quantity > remaining) {
      errors.push(
        `No puede devolver más de lo vendido: ${original.name}. Vendido: ${original.quantity}, Ya devuelto: ${alreadyReturned}, Disponible: ${remaining}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

export async function validateCreditNoteCreation(input: CreateCreditNoteInput): Promise<ValidationResult> {
  const errors: string[] = [];

  // Step 1: Validate input structure
  const inputValidation = await validateCreditNoteInput(input);
  if (!inputValidation.valid) {
    return inputValidation;
  }

  // Step 2: Validate original sale exists
  const { exists, sale } = await validateOriginalSaleExists(input.originalSaleId, input.originalSaleType);
  if (!exists) {
    errors.push('Venta original no encontrada');
    return { valid: false, errors };
  }

  // Step 3: Validate items are in original sale
  const itemsValidation = await validateItemsInOriginalSale(input.items, input.originalSaleType, sale);
  if (!itemsValidation.valid) {
    errors.push(...itemsValidation.errors);
  }

  // Step 4: Validate return quantities
  const quantitiesValidation = await validateReturnQuantities(input.items, input.originalSaleType, sale);
  if (!quantitiesValidation.valid) {
    errors.push(...quantitiesValidation.errors);
  }

  // Step 5: Validate cash requirements if refundMethod is CASH
  if (input.refundMethod === 'CASH') {
    const cashValidation = await validateCashRegisterOpen();
    if (!cashValidation.valid) {
      errors.push(...cashValidation.errors);
    }

    const paymentMethodValidation = await validatePaymentMethodForCash(input.paymentMethodId);
    if (!paymentMethodValidation.valid) {
      errors.push(...paymentMethodValidation.errors);
    }
  }

  return { valid: errors.length === 0, errors };
}
