import { db } from "@/lib/db";
import { vehicleMake, vehicleModel } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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
    // Try to find existing make
    let make = await db.query.vehicleMake.findFirst({
      where: eq(vehicleMake.normalizedName, normalizedName),
    });

    if (make) {
      // Update name if needed
      const updatedName = capitalizeText(makeName.trim());
      if (make.name !== updatedName) {
        await db.update(vehicleMake)
          .set({ name: updatedName })
          .where(eq(vehicleMake.id, make.id));
        make = { ...make, name: updatedName };
      }
    } else {
      // Create new make
      const [created] = await db.insert(vehicleMake).values({
        id: crypto.randomUUID(),
        name: capitalizeText(makeName.trim()),
        normalizedName,
      }).returning();
      make = created;
    }
    makeId = make.id;

    if (modelName?.trim()) {
      const normalizedModel = modelName.trim().toLowerCase();
      // Try to find existing model
      let model = await db.query.vehicleModel.findFirst({
        where: and(
          eq(vehicleModel.makeId, make.id),
          eq(vehicleModel.normalizedName, normalizedModel),
        ),
      });

      if (model) {
        // Update name if needed
        const updatedModelName = capitalizeText(modelName.trim());
        if (model.name !== updatedModelName) {
          await db.update(vehicleModel)
            .set({ name: updatedModelName })
            .where(eq(vehicleModel.id, model.id));
          model = { ...model, name: updatedModelName };
        }
      } else {
        // Create new model
        const [createdModel] = await db.insert(vehicleModel).values({
          id: crypto.randomUUID(),
          makeId: make.id,
          name: capitalizeText(modelName.trim()),
          normalizedName: normalizedModel,
        }).returning();
        model = createdModel;
      }
      modelId = model.id;
    }
  }

  return { makeId, modelId };
}
