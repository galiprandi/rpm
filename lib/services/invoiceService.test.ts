/**
 * Invoice Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createInvoice,
  updateInvoiceBillingData,
  determineInvoiceType,
  calculateInvoiceTaxes,
  getNextInvoiceNumber,
  getInvoices,
} from './invoiceService';

// vi.hoisted runs before vi.mock factory
const { mockFns } = vi.hoisted(() => ({
  mockFns: {
    invoiceFindFirst: vi.fn(),
    invoiceFindMany: vi.fn(),
    insertReturning: vi.fn(),
    updateReturning: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => {
  const queryObj = {
    invoice: {
      findFirst: mockFns.invoiceFindFirst,
      findMany: mockFns.invoiceFindMany,
    },
  };
  const insertBuilder = vi.fn(() => ({
    values: vi.fn(() => ({
      returning: mockFns.insertReturning,
    })),
  }));
  const updateBuilder = vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: mockFns.updateReturning,
      })),
    })),
  }));
  return {
    db: {
      select: vi.fn(),
      query: queryObj,
      insert: insertBuilder,
      update: updateBuilder,
      delete: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
      transaction: vi.fn(async (callback: any) => {
        const tx = {
          select: vi.fn(),
          query: queryObj,
          insert: insertBuilder,
          update: updateBuilder,
          delete: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
        };
        return callback(tx);
      }),
    },
  };
});

describe('Invoice Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateInvoiceBillingData', () => {
    it('should successfully update billing name and doc number on draft invoice', async () => {
      // First findFirst: find the invoice (returns draft invoice)
      mockFns.invoiceFindFirst.mockResolvedValueOnce({
        id: 'inv-1',
        type: 'X_B',
        status: 'DRAFT',
        customerName: 'TEST_INVOICE_CUSTOMER',
        customerDoc: '98765432',
        customerDocType: 'DNI',
        total: '1210',
        number: 'X-0001-00000001',
      });
      // update returning
      mockFns.updateReturning.mockResolvedValueOnce([{
        id: 'inv-1',
        type: 'X_B',
        status: 'DRAFT',
        customerName: 'TEST_INVOICE_CUST_UPDATED',
        customerDoc: '11223344',
        customerDocType: 'DNI',
      }]);

      const updated = await updateInvoiceBillingData('inv-1', {
        customerName: 'TEST_INVOICE_CUST_UPDATED',
        customerDoc: '11223344',
      });

      expect(updated.customerName).toBe('TEST_INVOICE_CUST_UPDATED');
      expect(updated.customerDoc).toBe('11223344');
      expect(updated.customerDocType).toBe('DNI'); // Kept unchanged
      expect(updated.type).toBe('X_B'); // Type unchanged
    });

    it('should automatically change type and assign next sequence number when doc type changes from DNI to CUIT', async () => {
      // First findFirst: find the invoice (returns draft X_B invoice)
      mockFns.invoiceFindFirst.mockResolvedValueOnce({
        id: 'inv-2',
        type: 'X_B',
        status: 'DRAFT',
        customerName: 'TEST_INVOICE_CUSTOMER',
        customerDoc: '98765432',
        customerDocType: 'DNI',
        total: '1210',
        number: 'X-0001-00000001',
      });
      // Second findFirst: getNextInvoiceNumber for X_A (returns null = first number)
      mockFns.invoiceFindFirst.mockResolvedValueOnce(null);
      // update returning
      mockFns.updateReturning.mockResolvedValueOnce([{
        id: 'inv-2',
        type: 'X_A',
        status: 'DRAFT',
        customerName: 'TEST_INVOICE_CUSTOMER',
        customerDoc: '20301234569',
        customerDocType: 'CUIT',
        number: 'X-0001-00000001',
      }]);

      const updated = await updateInvoiceBillingData('inv-2', {
        customerDocType: 'CUIT',
        customerDoc: '20301234569',
      });

      expect(updated.type).toBe('X_A');
      expect(updated.customerDocType).toBe('CUIT');
      expect(updated.customerDoc).toBe('20301234569');
    });

    it('should fail to update billing data on ISSUED invoices', async () => {
      mockFns.invoiceFindFirst.mockResolvedValueOnce({
        id: 'inv-3',
        type: 'X_B',
        status: 'ISSUED',
        customerName: 'TEST_INVOICE_CUSTOMER',
        customerDoc: '98765432',
        customerDocType: 'DNI',
        total: '1210',
      });

      await expect(
        updateInvoiceBillingData('inv-3', {
          customerName: 'TEST_INVOICE_CUST_FORBIDDEN',
        })
      ).rejects.toThrow('Solo se pueden editar comprobantes en estado DRAFT o REJECTED');
    });
  });

  describe('determineInvoiceType', () => {
    it('should determine correct type based on billing data', () => {
      expect(determineInvoiceType({ invoiceType: 'A' })).toBe('X_A');
      expect(determineInvoiceType({ invoiceType: 'B' })).toBe('X_B');
      expect(determineInvoiceType(null)).toBe('X_B');
      expect(determineInvoiceType({}, 'NOTA_CREDITO')).toBe('NOTA_CREDITO_X_B');
      expect(determineInvoiceType({ invoiceType: 'A' }, 'FACTURA', false)).toBe('FACTURA_A');
    });
  });

  describe('calculateInvoiceTaxes', () => {
    it('should calculate 21% taxes correctly', () => {
      const breakdown = calculateInvoiceTaxes(1210, 'X_B');
      expect(breakdown.subtotal).toBeCloseTo(1000);
      expect(breakdown.tax).toBeCloseTo(210);
      expect(breakdown.iva21).toBeCloseTo(210);
      expect(breakdown.iva105).toBe(0);
    });
  });

  describe('getNextInvoiceNumber', () => {
    it('should generate first invoice number if none exists', async () => {
      mockFns.invoiceFindFirst.mockResolvedValue(null);

      const num = await getNextInvoiceNumber('X_A');
      expect(num).toBe('X-0001-00000001');

      const presNum = await getNextInvoiceNumber('PRESUPUESTO');
      expect(presNum).toMatch(/^PRES-\d{8}$/);
    });

    it('should increment existing sequence number', async () => {
      // First call: get current number
      mockFns.invoiceFindFirst.mockResolvedValueOnce({
        number: 'X-0001-00000005',
      });
      const numBefore = await getNextInvoiceNumber('X_A');

      // createInvoice: findFirst for next number (returns existing), then insert
      mockFns.invoiceFindFirst.mockResolvedValueOnce({
        number: 'X-0001-00000005',
      });
      mockFns.insertReturning.mockResolvedValueOnce([{
        id: 'inv-new',
        type: 'X_A',
        number: 'X-0001-00000006',
      }]);

      await createInvoice({
        type: 'X_A',
        referenceId: 'wo-1',
        referenceType: 'work_order',
        customerId: 'cust-1',
        customerName: 'Test Customer',
        subtotal: 100,
        total: 121,
        status: 'DRAFT',
        createdBy: 'test',
      });

      // Next call should return incremented number
      mockFns.invoiceFindFirst.mockResolvedValueOnce({
        number: 'X-0001-00000006',
      });
      const nextNum = await getNextInvoiceNumber('X_A');
      const partsBefore = numBefore.split('-');
      const nextParts = nextNum.split('-');
      const beforeVal = parseInt(partsBefore[partsBefore.length - 1], 10);
      const nextVal = parseInt(nextParts[nextParts.length - 1], 10);
      expect(nextVal).toBe(beforeVal + 1);
    });
  });

  describe('getInvoices and Search', () => {
    it('should successfully filter and search invoices by customerDoc', async () => {
      mockFns.invoiceFindMany.mockResolvedValue([
        {
          id: 'inv-1',
          customerDoc: '20456789012',
          customerDocType: 'CUIT',
          customerName: 'Test Customer',
          type: 'X_B',
          status: 'DRAFT',
          total: '1210',
          customer: { name: 'Test Customer', phone: '123' },
        },
        {
          id: 'inv-2',
          customerDoc: '11223344',
          customerDocType: 'DNI',
          customerName: 'Test Customer',
          type: 'X_B',
          status: 'DRAFT',
          total: '1210',
          customer: { name: 'Test Customer', phone: '123' },
        },
      ]);

      // Search for the CUIT number
      const searchResult1 = await getInvoices({ search: '20456789012' });
      expect(searchResult1.length).toBeGreaterThanOrEqual(1);
      expect(searchResult1.some(inv => inv.customerDoc === '20456789012')).toBe(true);

      // Search for the DNI number
      const searchResult2 = await getInvoices({ search: '11223344' });
      expect(searchResult2.length).toBeGreaterThanOrEqual(1);
      expect(searchResult2.some(inv => inv.customerDoc === '11223344')).toBe(true);
    });
  });
});
