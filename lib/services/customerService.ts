/**
 * Customer Service - CRUD and search operations for customers
 *
 * Especificaciones relacionadas:
 * - /specs/features/customers.md
 *
 * Alcance del test:
 * - Validación de CRUD operations
 * - Búsqueda por nombre/teléfono
 * - Validación de datos de facturación
 *
 * Métricas cubiertas:
 * - Cobertura esperada: >90%
 * - Performance: <100ms por query
 */

import { db } from '@/lib/db';
import { customer, vehicle } from '@/db/schema';
import { eq, and, or, ilike, inArray, sql, desc, type SQL } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { capitalizeText } from '@/lib/utils/format';

// Types
export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  phoneAlt: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  billingData: {
    cuit: string | null;
    invoiceType: string | null;
  } | null;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  phoneAlt?: string;
  email?: string;
  address?: string;
  notes?: string;
  billingData?: {
    cuit: string;
    invoiceType: string;
  };
}

export interface CustomerFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CustomerListResult {
  customers: Customer[];
  total: number;
  limit: number;
  offset: number;
}

// Helper: Transform Drizzle customer to Customer type
function transformCustomer(c: typeof customer.$inferSelect): Customer {
  const balance = Number(c.balance) || 0;

  // Handle billingData - it's unknown from jsonb
  let billingData: Customer['billingData'] = null;
  if (c.billingData && typeof c.billingData === 'object' && !Array.isArray(c.billingData)) {
    const bd = c.billingData as Record<string, unknown>;
    if (bd.cuit || bd.invoiceType) {
      billingData = {
        cuit: (bd.cuit as string) || null,
        invoiceType: (bd.invoiceType as string) || null,
      };
    }
  }

  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    phoneAlt: c.phoneAlt,
    email: c.email,
    address: c.address,
    notes: c.notes,
    billingData,
    balance,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
  };
}

/**
 * Get customers with optional search and pagination
 */
export async function getCustomers(filters: CustomerFilters = {}): Promise<CustomerListResult> {
  const { search, limit = 50, offset = 0 } = filters;

  // Build where conditions
  const conditions: SQL[] = [];

  if (search) {
    // Search across customer fields
    const customerSearch = or(
      ilike(customer.name, `%${search}%`),
      ilike(customer.phone, `%${search}%`),
      ilike(customer.phoneAlt, `%${search}%`),
      ilike(customer.email, `%${search}%`),
      ilike(customer.address, `%${search}%`),
    );

    // Search across vehicle identifiers (subquery for customer IDs with matching vehicles)
    const vehicleMatch = inArray(
      customer.id,
      db.select({ id: vehicle.customerId }).from(vehicle).where(ilike(vehicle.identifier, `%${search.toUpperCase()}%`))
    );

    conditions.push(or(customerSearch, vehicleMatch)!);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [customers, totalRows] = await Promise.all([
    db.query.customer.findMany({
      where,
      with: {
        vehicles: {
          columns: {
            id: true,
            identifier: true,
            category: true,
          },
        },
      },
      orderBy: desc(customer.createdAt),
      limit,
      offset,
    }),
    db.select({ count: sql<number>`count(*)::int` })
      .from(customer)
      .where(where),
  ]);

  return {
    customers: customers.map(transformCustomer),
    total: totalRows[0]?.count ?? 0,
    limit,
    offset,
  };
}

/**
 * Get a single customer by ID
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  const c = await db.query.customer.findFirst({
    where: eq(customer.id, id),
    with: {
      vehicles: {
        columns: {
          id: true,
          identifier: true,
          category: true,
        },
      },
    },
  });

  if (!c) return null;
  return transformCustomer(c);
}

/**
 * Create a new customer
 */
export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
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

  const [created] = await db.insert(customer).values({
    id: randomUUID(),
    name: capitalizeText(name) || name,
    phone: phone || null,
    phoneAlt: phoneAlt || null,
    email: email || null,
    address: address || null,
    notes: notes || null,
    billingData: billingData as any || null,
    updatedAt: new Date().toISOString(),
  }).returning();

  return transformCustomer(created);
}

/**
 * Update an existing customer
 */
export async function updateCustomer(id: string, input: Partial<CreateCustomerInput>): Promise<Customer> {
  const { name, phone, phoneAlt, email, address, notes, billingData } = input;

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

  const data: Partial<typeof customer.$inferInsert> = {};
  if (name !== undefined) data.name = capitalizeText(name) || name;
  if (phone !== undefined) data.phone = phone;
  if (phoneAlt !== undefined) data.phoneAlt = phoneAlt;
  if (email !== undefined) data.email = email;
  if (address !== undefined) data.address = address;
  if (notes !== undefined) data.notes = notes;
  if (billingData !== undefined) data.billingData = billingData as any;
  data.updatedAt = new Date().toISOString();

  const [updated] = await db.update(customer).set(data).where(eq(customer.id, id)).returning();

  if (!updated) throw new Error('Customer not found');

  return transformCustomer(updated);
}

/**
 * Soft delete (deactivate) a customer
 * Note: Currently not implemented as isActive field doesn't exist in schema
 */
export async function deactivateCustomer(_id: string): Promise<void> {
  // TODO: Implement when isActive field is added to schema
  // For now, this is a no-op
  throw new Error('deactivateCustomer not implemented - isActive field missing from schema');
}
