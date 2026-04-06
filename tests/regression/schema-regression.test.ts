/**
 * Schema Regression Tests
 * Tests para garantizar que el refactor del schema no rompa funcionalidad
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Schema Regression Tests', () => {
  beforeAll(async () => {
    // Crear datos de prueba si no existen
    await setupTestData();
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await cleanupTestData();
  });

  describe('Customer Model', () => {
    it('should create and retrieve customer with vehicles', async () => {
      // Crear customer
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          phone: '123456789',
          email: 'test@example.com',
        },
      });

      expect(customer).toBeDefined();
      expect(customer.name).toBe('Test Customer');

      // Recuperar con relaciones
      const retrieved = await prisma.customer.findUnique({
        where: { id: customer.id },
        include: {
          vehicle: true,
          work_order: true,
        },
      });

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Customer');
      expect(Array.isArray(retrieved?.vehicle)).toBe(true);
      expect(Array.isArray(retrieved?.work_order)).toBe(true);

      // Limpiar
      await prisma.customer.delete({ where: { id: customer.id } });
    });

    it('should list customers with count', async () => {
      const customers = await prisma.customer.findMany({
        include: {
          _count: {
            select: {
              vehicle: true,
              work_order: true,
            },
          },
        },
      });

      expect(Array.isArray(customers)).toBe(true);
      customers.forEach(customer => {
        expect(typeof customer._count.vehicle).toBe('number');
        expect(typeof customer._count.work_order).toBe('number');
      });
    });
  });

  describe('Product Model', () => {
    it('should create product with supplier and category', async () => {
      // Crear categoría y proveedor de prueba
      const category = await prisma.category.create({
        data: { name: 'Test Category' },
      });

      const supplier = await prisma.supplier.create({
        data: { name: 'Test Supplier' },
      });

      // Crear producto
      const product = await prisma.product.create({
        data: {
          name: 'Test Product',
          costPrice: 100,
          categoryId: category.id,
          supplierId: supplier.id,
        },
      });

      expect(product).toBeDefined();
      expect(product.name).toBe('Test Product');
      expect(product.categoryId).toBe(category.id);
      expect(product.supplierId).toBe(supplier.id);

      // Recuperar con relaciones
      const retrieved = await prisma.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          supplier: true,
        },
      });

      expect(retrieved?.category?.name).toBe('Test Category');
      expect(retrieved?.supplier?.name).toBe('Test Supplier');

      // Limpiar
      await prisma.product.delete({ where: { id: product.id } });
      await prisma.category.delete({ where: { id: category.id } });
      await prisma.supplier.delete({ where: { id: supplier.id } });
    });
  });

  describe('API Endpoints Compatibility', () => {
    it('should /api/customers work', async () => {
      const response = await fetch('http://localhost:3000/api/customers?limit=5');
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.customers).toBeDefined();
      expect(Array.isArray(data.customers)).toBe(true);
    });

    it('should /api/categories work', async () => {
      const response = await fetch('http://localhost:3000/api/categories');
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.categories).toBeDefined();
      expect(Array.isArray(data.categories)).toBe(true);
    });

    it('should /api/suppliers work', async () => {
      const response = await fetch('http://localhost:3000/api/suppliers');
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.suppliers).toBeDefined();
      expect(Array.isArray(data.suppliers)).toBe(true);
    });
  });
});

async function setupTestData() {
  // Asegurar que existan datos básicos
  const defaultCategory = await prisma.category.upsert({
    where: { name: 'Sin categoría' },
    update: {},
    create: { name: 'Sin categoría' },
  });

  const defaultSupplier = await prisma.supplier.upsert({
    where: { name: 'Sin especificar' },
    update: {},
    create: { name: 'Sin especificar' },
  });
}

async function cleanupTestData() {
  // Limpiar solo datos de prueba (no los datos por defecto)
  await prisma.product.deleteMany({
    where: {
      name: { startsWith: 'Test' },
    },
  });

  await prisma.customer.deleteMany({
    where: {
      name: { startsWith: 'Test' },
    },
  });

  await prisma.category.deleteMany({
    where: {
      name: { startsWith: 'Test' },
    },
  });

  await prisma.supplier.deleteMany({
    where: {
      name: { startsWith: 'Test' },
    },
  });
}
