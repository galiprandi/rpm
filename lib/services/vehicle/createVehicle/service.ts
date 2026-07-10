import { prisma } from '@/lib/prisma';
import { capitalizeText } from '@/lib/utils/format';
import type { CreateVehicleInput } from './schema';

export async function createVehicleService(input: CreateVehicleInput) {
  const vehicle = await prisma.vehicle.create({
    data: {
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
      updatedAt: new Date(),
    },
    include: {
      customer: true,
      vehicle_make: true,
      vehicle_model: true,
    },
  });

  return vehicle;
}
