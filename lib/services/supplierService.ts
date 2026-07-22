/**
 * Supplier Service - CRUD operations for suppliers
 * 
 * Especificaciones relacionadas:
 * - /specs/suppliers.md
 * - /specs/data-architecture.md#proveedores
 */

import { db } from '@/lib/db';
import { supplier, product } from '@/db/schema';
import { eq, sql, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

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

// Helper: count products for a supplier
async function countProductsBySupplier(supplierId: string): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)::int` })
    .from(product)
    .where(eq(product.supplierId, supplierId));
  return row?.count ?? 0;
}

// Helper: Transform Drizzle supplier to Supplier type
function transformSupplier(
  s: typeof supplier.$inferSelect,
  productCount: number
): Supplier {
  return {
    id: s.id,
    name: s.name,
    contactName: s.contactName,
    phone: s.phone,
    email: s.email,
    address: s.address,
    notes: s.notes,
    isActive: s.isActive,
    productCount,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  };
}

/**
 * Get all suppliers with product count
 */
export async function getSuppliers(includeInactive: boolean = false): Promise<SupplierListResult> {
  const suppliers = await db.query.supplier.findMany({
    where: includeInactive ? undefined : eq(supplier.isActive, true),
    orderBy: asc(supplier.name),
  });

  // Get product counts for all suppliers in a single query
  const counts = await db.select({
    supplierId: product.supplierId,
    count: sql<number>`count(*)::int`,
  })
    .from(product)
    .where(sql`${product.supplierId} IS NOT NULL`)
    .groupBy(product.supplierId);

  const countMap = new Map<string, number>(counts.map(c => [c.supplierId!, c.count]));

  const transformed = suppliers.map(s => transformSupplier(s, countMap.get(s.id) ?? 0));

  return {
    suppliers: transformed,
    total: transformed.length,
  };
}

/**
 * Get a single supplier by ID
 */
export async function getSupplierById(id: string): Promise<Supplier | null> {
  const s = await db.query.supplier.findFirst({
    where: eq(supplier.id, id),
  });

  if (!s) return null;

  const productCount = await countProductsBySupplier(id);
  return transformSupplier(s, productCount);
}

/**
 * Get a single supplier by name
 */
export async function getSupplierByName(name: string): Promise<Supplier | null> {
  const s = await db.query.supplier.findFirst({
    where: eq(supplier.name, name),
  });

  if (!s) return null;

  const productCount = await countProductsBySupplier(s.id);
  return transformSupplier(s, productCount);
}

/**
 * Create a new supplier
 */
export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const [created] = await db.insert(supplier).values({
    id: randomUUID(),
    name: input.name,
    contactName: input.contactName || null,
    phone: input.phone || null,
    email: input.email || null,
    address: input.address || null,
    notes: input.notes || null,
    isActive: true,
    updatedAt: new Date().toISOString(),
  }).returning();

  return transformSupplier(created, 0);
}

/**
 * Update an existing supplier
 */
export async function updateSupplier(id: string, input: UpdateSupplierInput): Promise<Supplier> {
  const data: Partial<typeof supplier.$inferInsert> = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.contactName !== undefined) data.contactName = input.contactName || null;
  if (input.phone !== undefined) data.phone = input.phone || null;
  if (input.email !== undefined) data.email = input.email || null;
  if (input.address !== undefined) data.address = input.address || null;
  if (input.notes !== undefined) data.notes = input.notes || null;
  data.updatedAt = new Date().toISOString();

  const [updated] = await db.update(supplier).set(data).where(eq(supplier.id, id)).returning();

  if (!updated) throw new Error('Supplier not found');

  const productCount = await countProductsBySupplier(id);
  return transformSupplier(updated, productCount);
}

/**
 * Deactivate a supplier (soft delete)
 * Only allows deletion if no products are associated
 */
export async function deactivateSupplier(id: string): Promise<Supplier> {
  const [updated] = await db.update(supplier)
    .set({ isActive: false, updatedAt: new Date().toISOString() })
    .where(eq(supplier.id, id))
    .returning();

  if (!updated) throw new Error('Supplier not found');

  const productCount = await countProductsBySupplier(id);
  return transformSupplier(updated, productCount);
}

/**
 * Check if supplier has associated products
 */
export async function hasAssociatedProducts(id: string): Promise<boolean> {
  const productCount = await countProductsBySupplier(id);
  return productCount > 0;
}
