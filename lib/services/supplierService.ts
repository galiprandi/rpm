/**
 * Supplier Service - CRUD operations for suppliers
 * 
 * Especificaciones relacionadas:
 * - /specs/suppliers.md
 * - /specs/data-architecture.md#proveedores
 */

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { Prisma } from '@/generated/client';

// Types
export interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSupplierInput {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export interface SupplierListResult {
  suppliers: Supplier[];
  total: number;
}

/**
 * Get all suppliers with product count
 */
export async function getSuppliers(includeInactive: boolean = false): Promise<SupplierListResult> {
  const suppliers = await prisma.supplier.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { product: true },
      },
    },
  });

  return {
    suppliers: suppliers.map(s => ({
      ...s,
      productCount: s._count.product,
    })),
    total: suppliers.length,
  };
}

/**
 * Get a single supplier by ID
 */
export async function getSupplierById(id: string): Promise<Supplier | null> {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      _count: {
        select: { product: true },
      },
    },
  });

  if (!supplier) return null;

  return {
    ...supplier,
    productCount: supplier._count.product,
  };
}

/**
 * Get a single supplier by name
 */
export async function getSupplierByName(name: string): Promise<Supplier | null> {
  const supplier = await prisma.supplier.findUnique({
    where: { name },
    include: {
      _count: {
        select: { product: true },
      },
    },
  });

  if (!supplier) return null;

  return {
    ...supplier,
    productCount: supplier._count.product,
  };
}

/**
 * Create a new supplier
 */
export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const supplier = await prisma.supplier.create({
    data: {
      id: randomUUID(),
      name: input.name,
      contactName: input.contactName || null,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      notes: input.notes || null,
      isActive: true,
      updatedAt: new Date(),
    },
    include: {
      _count: {
        select: { product: true },
      },
    },
  });

  return {
    ...supplier,
    productCount: supplier._count.product,
  };
}

/**
 * Update an existing supplier
 */
export async function updateSupplier(id: string, input: UpdateSupplierInput): Promise<Supplier> {
  const data: Prisma.supplierUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.contactName !== undefined) data.contactName = input.contactName || null;
  if (input.phone !== undefined) data.phone = input.phone || null;
  if (input.email !== undefined) data.email = input.email || null;
  if (input.address !== undefined) data.address = input.address || null;
  if (input.notes !== undefined) data.notes = input.notes || null;

  const supplier = await prisma.supplier.update({
    where: { id },
    data,
    include: {
      _count: {
        select: { product: true },
      },
    },
  });

  return {
    ...supplier,
    productCount: supplier._count.product,
  };
}

/**
 * Deactivate a supplier (soft delete)
 * Only allows deletion if no products are associated
 */
export async function deactivateSupplier(id: string): Promise<Supplier> {
  const supplier = await prisma.supplier.update({
    where: { id },
    data: { isActive: false },
    include: {
      _count: {
        select: { product: true },
      },
    },
  });

  return {
    ...supplier,
    productCount: supplier._count.product,
  };
}

/**
 * Check if supplier has associated products
 */
export async function hasAssociatedProducts(id: string): Promise<boolean> {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      _count: {
        select: { product: true },
      },
    },
  });

  return (supplier?._count.product ?? 0) > 0;
}
