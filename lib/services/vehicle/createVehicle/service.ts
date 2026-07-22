import { db } from '@/lib/db';
import { vehicle } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { capitalizeText } from '@/lib/utils/format';
import type { CreateVehicleInput } from './schema';

export async function createVehicleService(input: CreateVehicleInput) {
  const [created] = await db.insert(vehicle).values({
    id: crypto.randomUUID(),
    identifier: input.identifier.toUpperCase(),
    category: input.category,
    customerId: input.customerId,
    makeId: input.makeId ?? null,
    modelId: input.modelId ?? null,
    year: input.year ?? null,
    color: input.color ? capitalizeText(input.color) : null,
    equipmentName: input.equipmentName ?? null,
    equipmentType: input.equipmentType ?? null,
    description: input.description ?? null,
    notes: input.notes ?? null,
    updatedAt: new Date().toISOString(),
  }).returning();

  // Fetch with relations
  const result = await db.query.vehicle.findFirst({
    where: eq(vehicle.id, created.id),
    with: {
      customer: true,
      vehicleMake: true,
      vehicleModel: true,
    },
  });

  return result;
}
