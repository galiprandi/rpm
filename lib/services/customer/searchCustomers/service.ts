import { prisma } from '@/lib/prisma';
import type { SearchCustomersInput } from './schema';

/**
 * searchCustomersService - Pure function to search customers
 *
 * This service is shared between:
 * - API routes (app/api/customers/route.ts)
 * - AI tools (lib/services/customer/searchCustomers/tool.ts)
 *
 * @param input - Search parameters
 * @returns List of matching customers
 */
export async function searchCustomersService(input: SearchCustomersInput) {
  const { search, limit = 10 } = input;

  // Build where clause
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const customers = await prisma.customer.findMany({
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
  });

  return customers;
}
