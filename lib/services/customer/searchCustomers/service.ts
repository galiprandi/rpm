import { db } from '@/lib/db';
import { customer, vehicle } from '@/db/schema';
import { or, ilike, inArray, desc, type SQL } from 'drizzle-orm';
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

  // Build where conditions — search across name, phone, phoneAlt, email, and vehicle identifier
  let where: SQL | undefined;

  if (search) {
    const customerSearch = or(
      ilike(customer.name, `%${search}%`),
      ilike(customer.phone, `%${search}%`),
      ilike(customer.phoneAlt, `%${search}%`),
      ilike(customer.email, `%${search}%`),
      ilike(customer.address, `%${search}%`),
    );

    const vehicleMatch = inArray(
      customer.id,
      db.select({ id: vehicle.customerId }).from(vehicle).where(ilike(vehicle.identifier, `%${search.toUpperCase()}%`))
    );

    where = or(customerSearch, vehicleMatch)!;
  }

  const customers = await db.query.customer.findMany({
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
  });

  return customers;
}
