/**
 * Invoice Service Integration Tests
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  createInvoice,
  updateInvoiceBillingData,
} from './invoiceService';

describe('Invoice Service', () => {
  let testCustomer: any;

  beforeEach(async () => {
    // Ensure clean state for test customers and invoices
    await prisma.invoice.deleteMany({
      where: {
        customerName: { startsWith: 'TEST_INVOICE_CUST' },
      },
    });

    await prisma.customer.deleteMany({
      where: {
        name: { startsWith: 'TEST_INVOICE_CUST' },
      },
    });

    // Create a mock customer for testing
    testCustomer = await prisma.customer.create({
      data: {
        name: 'TEST_INVOICE_CUSTOMER',
        email: 'test@invoice.com',
        phone: '123456789',
        balance: 0,
        updatedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.invoice.deleteMany({
      where: {
        customerName: { startsWith: 'TEST_INVOICE_CUST' },
      },
    });

    await prisma.customer.deleteMany({
      where: {
        name: { startsWith: 'TEST_INVOICE_CUST' },
      },
    });
  });

  describe('updateInvoiceBillingData', () => {
    it('should successfully update billing name and doc number on draft invoice', async () => {
      // 1. Create draft invoice
      const invoice = await createInvoice({
        type: 'X_B',
        referenceId: 'some-wo-id',
        referenceType: 'work_order',
        customerId: testCustomer.id,
        customerName: testCustomer.name,
        customerDoc: '98765432',
        customerDocType: 'DNI',
        subtotal: 1000,
        tax: 210,
        iva21: 210,
        total: 1210,
        status: 'DRAFT',
        createdBy: 'test-user-id',
      });

      expect(invoice.customerName).toBe('TEST_INVOICE_CUSTOMER');
      expect(invoice.customerDoc).toBe('98765432');
      expect(invoice.customerDocType).toBe('DNI');

      // 2. Update billing data
      const updated = await updateInvoiceBillingData(invoice.id, {
        customerName: 'TEST_INVOICE_CUST_UPDATED',
        customerDoc: '11223344',
      });

      expect(updated.customerName).toBe('TEST_INVOICE_CUST_UPDATED');
      expect(updated.customerDoc).toBe('11223344');
      expect(updated.customerDocType).toBe('DNI'); // Kept unchanged
      expect(updated.type).toBe('X_B'); // Type unchanged
    });

    it('should automatically change type and assign next sequence number when doc type changes from DNI to CUIT', async () => {
      // 1. Create draft invoice X_B
      const invoice = await createInvoice({
        type: 'X_B',
        referenceId: 'some-wo-id-2',
        referenceType: 'work_order',
        customerId: testCustomer.id,
        customerName: testCustomer.name,
        customerDoc: '98765432',
        customerDocType: 'DNI',
        subtotal: 1000,
        tax: 210,
        iva21: 210,
        total: 1210,
        status: 'DRAFT',
        createdBy: 'test-user-id',
      });

      expect(invoice.type).toBe('X_B');
      const originalNum = invoice.number;

      // 2. Change doc type to CUIT
      const updated = await updateInvoiceBillingData(invoice.id, {
        customerDocType: 'CUIT',
        customerDoc: '20301234569',
      });

      // Type should become X_A
      expect(updated.type).toBe('X_A');
      expect(updated.customerDocType).toBe('CUIT');
      expect(updated.customerDoc).toBe('20301234569');
      expect(updated.number).not.toBe(originalNum);
      expect(updated.number).toContain('X-0001-');
    });

    it('should fail to update billing data on ISSUED invoices', async () => {
      // 1. Create ISSUED invoice
      const invoice = await createInvoice({
        type: 'X_B',
        referenceId: 'some-wo-id-3',
        referenceType: 'work_order',
        customerId: testCustomer.id,
        customerName: testCustomer.name,
        customerDoc: '98765432',
        customerDocType: 'DNI',
        subtotal: 1000,
        tax: 210,
        iva21: 210,
        total: 1210,
        status: 'ISSUED', // ISSUED status!
        createdBy: 'test-user-id',
      });

      // 2. Attempt to update should throw error
      await expect(
        updateInvoiceBillingData(invoice.id, {
          customerName: 'TEST_INVOICE_CUST_FORBIDDEN',
        })
      ).rejects.toThrow('Solo se pueden editar comprobantes en estado DRAFT o REJECTED');
    });
  });
});
