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

import { prisma } from '@/lib/prisma';
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

// Helper: Transform Prisma customer to Customer type
function transformCustomer(customer: {
  id: string;
  name: string;
  phone: string | null;
  phoneAlt: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  billingData: unknown;
  balance: number | { toNumber: () => number };
  createdAt: Date;
  updatedAt: Date;
  vehicle?: unknown;
  _count?: unknown;
}): Customer {
  const balance = typeof customer.balance === 'number'
    ? customer.balance
    : customer.balance?.toNumber?.() || 0;

  // Handle billingData - it might be JsonValue from Prisma
  let billingData: Customer['billingData'] = null;
  if (customer.billingData && typeof customer.billingData === 'object' && !Array.isArray(customer.billingData)) {
    const bd = customer.billingData as Record<string, unknown>;
    if (bd.cuit || bd.invoiceType) {
      billingData = {
        cuit: (bd.cuit as string) || null,
        invoiceType: (bd.invoiceType as string) || null,
      };
    }
  }

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    phoneAlt: customer.phoneAlt,
    email: customer.email,
    address: customer.address,
    notes: customer.notes,
    billingData,
    balance,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

/**
 * Get customers with optional search and pagination
 */
export async function getCustomers(filters: CustomerFilters = {}): Promise<CustomerListResult> {
  const { search, limit = 50, offset = 0 } = filters;

  // Build where clause
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            identifier: true,
            category: true,
          },
        },
        _count: {
          select: {
            work_order: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers: customers.map(transformCustomer),
    total,
    limit,
    offset,
  };
}

/**
 * Get a single customer by ID
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      vehicle: {
        select: {
          id: true,
          identifier: true,
          category: true,
        },
      },
    },
  });

  if (!customer) return null;
  return transformCustomer(customer);
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

  return transformCustomer(customer);
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

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: capitalizeText(name) || name }),
      ...(phone !== undefined && { phone }),
      ...(phoneAlt !== undefined && { phoneAlt }),
      ...(email !== undefined && { email }),
      ...(address !== undefined && { address }),
      ...(notes !== undefined && { notes }),
      ...(billingData !== undefined && { billingData }),
      updatedAt: new Date(),
    },
  });

  return transformCustomer(customer);
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
