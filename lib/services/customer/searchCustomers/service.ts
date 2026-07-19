import { prisma } from '@/lib/prisma';
import type { SearchCustomersInput } from './schema';

/**
 * searchCustomersService - Search customers by name, phone, email, or vehicle plate.
 *
 * Shared between API routes and AI tools.
 *
 * @param input - Search parameters
 * @returns List of matching customers with vehicles and OT count
 */
export async function searchCustomersService(input: SearchCustomersInput) {
  const { search, limit = 10 } = input;

  // Build where clause — search across name, phone, phoneAlt, email, and vehicle identifier
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
          { phoneAlt: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { address: { contains: search, mode: 'insensitive' as const } },
          {
            vehicle: {
              some: {
                identifier: { contains: search.toUpperCase(), mode: 'insensitive' as const },
              },
            },
          },
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
