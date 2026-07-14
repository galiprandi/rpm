import { prisma } from "@/lib/prisma";
import { capitalizeText } from "@/lib/utils/format";

/**
 * Resolve or create vehicle_make and vehicle_model from names.
 * Returns { makeId, modelId } or { makeId: undefined, modelId: undefined } if names are empty.
 */
export async function resolveMakeModel(makeName?: string, modelName?: string) {
  let makeId: string | undefined = undefined;
  let modelId: string | undefined = undefined;

  if (makeName?.trim()) {
    const normalizedName = makeName.trim().toLowerCase();
    const make = await prisma.vehicle_make.upsert({
      where: { normalizedName },
      update: { name: capitalizeText(makeName.trim()) },
      create: {
        id: crypto.randomUUID(),
        name: capitalizeText(makeName.trim()),
        normalizedName,
      },
    });
    makeId = make.id;

    if (modelName?.trim()) {
      const normalizedModel = modelName.trim().toLowerCase();
      const model = await prisma.vehicle_model.upsert({
        where: {
          makeId_normalizedName: {
            makeId: make.id,
            normalizedName: normalizedModel,
          },
        },
        update: { name: capitalizeText(modelName.trim()) },
        create: {
          id: crypto.randomUUID(),
          makeId: make.id,
          name: capitalizeText(modelName.trim()),
          normalizedName: normalizedModel,
        },
      });
      modelId = model.id;
    }
  }

  return { makeId, modelId };
}
