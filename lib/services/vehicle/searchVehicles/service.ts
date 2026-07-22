import { db } from '@/lib/db';
import { vehicle, customer } from '@/db/schema';
import { eq, and, ilike, inArray, desc, type SQL } from 'drizzle-orm';
import type { SearchVehiclesInput } from './schema';

/**
 * searchVehiclesService - Search vehicles by identifier, customer name, or customer ID.
 *
 * Shared between API routes and AI tools.
 *
 * @param input - Search parameters
 * @returns List of matching vehicles with customer and model info
 */
export async function searchVehiclesService(input: SearchVehiclesInput) {
  const { identifier, customerName, customerId, limit = 10 } = input;

  const conditions: SQL[] = [];

  if (identifier) {
    conditions.push(ilike(vehicle.identifier, `%${identifier.toUpperCase()}%`));
  }

  if (customerId) {
    conditions.push(eq(vehicle.customerId, customerId));
  }

  // For customerName, we need to filter on the related customer's name
  if (customerName) {
    // Fetch matching customer IDs first
    const matchingCustomers = await db.query.customer.findMany({
      where: ilike(customer.name, `%${customerName}%`),
      columns: { id: true },
    });
    const customerIds = matchingCustomers.map(c => c.id);
    if (customerIds.length > 0) {
      conditions.push(inArray(vehicle.customerId, customerIds));
    } else {
      // No matching customers, return empty
      return [];
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const vehicles = await db.query.vehicle.findMany({
    where,
    with: {
      customer: { columns: { id: true, name: true, phone: true } },
      vehicleMake: { columns: { name: true } },
      vehicleModel: { columns: { name: true } },
    },
    orderBy: desc(vehicle.updatedAt),
    limit,
  });

  return vehicles;
}
