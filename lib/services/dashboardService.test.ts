/**
 * Dashboard Service Tests
 *
 * Tests for getDashboardData() function
 */

import { describe, it, expect } from 'vitest';
import { getDashboardData } from './dashboardService';

describe('Dashboard Service', () => {
  describe('getDashboardData', () => {
    it('should return dashboard data structure', async () => {
      const result = await getDashboardData();

      expect(result).toBeDefined();
      expect(result.sales).toBeDefined();
      expect(result.workOrders).toBeDefined();
      expect(result.stock).toBeDefined();
      expect(result.readyForDelivery).toBeInstanceOf(Array);
      expect(result.recentMovements).toBeInstanceOf(Array);
      expect(result.paymentsByMethod).toBeInstanceOf(Array);
      expect(result.cashMovements).toBeInstanceOf(Array);
      expect(result.generatedAt).toBeDefined();
    });

    it('should include sales metrics', async () => {
      const result = await getDashboardData();

      expect(result.sales.today).toBeDefined();
      expect(typeof result.sales.today.total).toBe('number');
      expect(typeof result.sales.today.workOrderCount).toBe('number');
      expect(typeof result.sales.today.vsYesterday).toBe('number');
      expect(typeof result.sales.ticketAverage).toBe('number');
    });

    it('should include work orders metrics', async () => {
      const result = await getDashboardData();

      expect(result.workOrders.active).toBeDefined();
      expect(typeof result.workOrders.active.total).toBe('number');
      expect(result.workOrders.active.byStatus).toBeDefined();
      expect(typeof result.workOrders.active.byStatus.pending).toBe('number');
      expect(typeof result.workOrders.active.byStatus.inProgress).toBe('number');
      expect(typeof result.workOrders.active.byStatus.ready).toBe('number');
      expect(typeof result.workOrders.active.newToday).toBe('number');
    });

    it('should include stock metrics', async () => {
      const result = await getDashboardData();

      expect(result.stock).toBeDefined();
      expect(typeof result.stock.lowStockCount).toBe('number');
      expect(Array.isArray(result.stock.lowStockItems)).toBe(true);
    });

    it('should group payments by method', async () => {
      const result = await getDashboardData();

      expect(Array.isArray(result.paymentsByMethod)).toBe(true);
      
      if (result.paymentsByMethod && result.paymentsByMethod.length > 0) {
        const firstPayment = result.paymentsByMethod[0];
        expect(firstPayment).toHaveProperty('code');
        expect(firstPayment).toHaveProperty('name');
        expect(firstPayment).toHaveProperty('total');
        expect(typeof firstPayment.total).toBe('number');
      }
    });

    it('should include cash movements', async () => {
      const result = await getDashboardData();

      expect(Array.isArray(result.cashMovements)).toBe(true);
      
      if (result.cashMovements && result.cashMovements.length > 0) {
        const firstMovement = result.cashMovements[0];
        expect(firstMovement).toHaveProperty('id');
        expect(firstMovement).toHaveProperty('type');
        expect(firstMovement).toHaveProperty('amount');
        expect(firstMovement).toHaveProperty('method');
        expect(firstMovement).toHaveProperty('createdAt');
      }
    });

    it('should include recent stock movements', async () => {
      const result = await getDashboardData();

      expect(Array.isArray(result.recentMovements)).toBe(true);
      
      if (result.recentMovements.length > 0) {
        const firstMovement = result.recentMovements[0];
        expect(firstMovement).toHaveProperty('type');
        expect(firstMovement).toHaveProperty('productName');
        expect(firstMovement).toHaveProperty('quantity');
        expect(firstMovement).toHaveProperty('timestamp');
      }
    });

    it('should have valid timestamp', async () => {
      const result = await getDashboardData();
      const generatedAt = new Date(result.generatedAt);

      expect(generatedAt).toBeInstanceOf(Date);
      expect(generatedAt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(generatedAt.getTime()).toBeGreaterThan(Date.now() - 60000); // Within last minute
    });

    it('should handle empty data gracefully', async () => {
      // This test verifies that the service doesn't crash with empty data
      // The actual data depends on the database state
      const result = await getDashboardData();

      expect(result).toBeDefined();
      expect(result.sales.today.total).toBeGreaterThanOrEqual(0);
      expect(result.workOrders.active.total).toBeGreaterThanOrEqual(0);
      expect(result.stock.lowStockCount).toBeGreaterThanOrEqual(0);
    });
  });
});
