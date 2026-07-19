import { prisma } from '@/lib/prisma';
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

  const where: Record<string, unknown> = {};

  if (identifier) {
    where.identifier = { contains: identifier.toUpperCase(), mode: 'insensitive' };
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (customerName) {
    where.customer = {
      name: { contains: customerName, mode: 'insensitive' },
    };
  }

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      customer: {
        select: { id: true, name: true, phone: true },
      },
      vehicle_make: { select: { name: true } },
      vehicle_model: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  return vehicles;
}
