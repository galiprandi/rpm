import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photo, workOrder } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { withStaffDynamic } from "@/lib/api-middleware";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/work-orders/[id]/photos - Add photos to work order (STAFF or above)
export const POST = withStaffDynamic(
  async (request: NextRequest, { params }: Params, _session) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { type, url, description } = body;

      if (!type || !url) {
        return NextResponse.json(
          { error: "Missing required fields: type, url" },
          { status: 400 }
        );
      }

      if (!["ENTRY", "EXIT"].includes(type)) {
        return NextResponse.json(
          { error: "Invalid type. Must be ENTRY or EXIT" },
          { status: 400 }
        );
      }

      // Create photo record
      const [createdPhoto] = await db.insert(photo).values({
        id: crypto.randomUUID(),
        workOrderId: id,
        type,
        url,
        description,
      }).returning();

      // Update work order photo arrays
      if (type === "ENTRY") {
        await db.update(workOrder)
          .set({
            entryPhotos: sql`array_append(${workOrder.entryPhotos}, ${url})`,
          })
          .where(eq(workOrder.id, id));
      } else {
        await db.update(workOrder)
          .set({
            exitPhotos: sql`array_append(${workOrder.exitPhotos}, ${url})`,
          })
          .where(eq(workOrder.id, id));
      }

      return NextResponse.json(createdPhoto, { status: 201 });
    } catch (error) {
      console.error("Error adding photo:", error);
      return NextResponse.json(
        { error: "Failed to add photo" },
        { status: 500 }
      );
    }
  }
);

// GET /api/work-orders/[id]/photos - Get photos for work order (STAFF or above)
export const GET = withStaffDynamic(
  async (request: NextRequest, { params }: Params, _session) => {
    try {
      const { id } = await params;
      const { searchParams } = request.nextUrl;
      const type = searchParams.get("type");

      const conditions = [eq(photo.workOrderId, id)];
      if (type) conditions.push(eq(photo.type, type));

      const photos = await db.query.photo.findMany({
        where: and(...conditions),
        orderBy: desc(photo.createdAt),
      });

      return NextResponse.json({ photos });
    } catch (error) {
      console.error("Error fetching photos:", error);
      return NextResponse.json(
        { error: "Failed to fetch photos" },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/work-orders/[id]/photos - Delete a photo from work order (STAFF or above)
export const DELETE = withStaffDynamic(
  async (request: NextRequest, { params }: Params, _session) => {
    try {
      const { id } = await params;
      const { searchParams } = request.nextUrl;
      const photoId = searchParams.get("photoId");
      const url = searchParams.get("url");

      if (!photoId && !url) {
        return NextResponse.json(
          { error: "Missing required parameter: photoId or url" },
          { status: 400 }
        );
      }

      let photoRecord;
      if (photoId) {
        photoRecord = await db.query.photo.findFirst({
          where: eq(photo.id, photoId),
        });
      } else if (url) {
        photoRecord = await db.query.photo.findFirst({
          where: and(eq(photo.workOrderId, id), eq(photo.url, url)),
        });
      }

      if (!photoRecord) {
        // Fallback: if no photo record found in DB but url is provided, remove url from the arrays of work_order anyway.
        if (url) {
          const wo = await db.query.workOrder.findFirst({
            where: eq(workOrder.id, id),
            columns: { entryPhotos: true, exitPhotos: true },
          });
          if (wo) {
            const entryPhotos = (wo.entryPhotos || []).filter((p) => p !== url);
            const exitPhotos = (wo.exitPhotos || []).filter((p) => p !== url);
            await db.update(workOrder)
              .set({ entryPhotos, exitPhotos })
              .where(eq(workOrder.id, id));
          }
          return NextResponse.json({
            success: true,
            message: "Photo URL removed from arrays",
          });
        }
        return NextResponse.json({ error: "Photo not found" }, { status: 404 });
      }

      // Delete photo record from DB
      await db.delete(photo).where(eq(photo.id, photoRecord.id));

      // Update work order arrays
      const wo = await db.query.workOrder.findFirst({
        where: eq(workOrder.id, id),
        columns: { entryPhotos: true, exitPhotos: true },
      });

      if (wo) {
        if (photoRecord.type === "ENTRY") {
          const entryPhotos = (wo.entryPhotos || []).filter((p) => p !== photoRecord.url);
          await db.update(workOrder)
            .set({ entryPhotos })
            .where(eq(workOrder.id, id));
        } else {
          const exitPhotos = (wo.exitPhotos || []).filter((p) => p !== photoRecord.url);
          await db.update(workOrder)
            .set({ exitPhotos })
            .where(eq(workOrder.id, id));
        }
      }

      return NextResponse.json({
        success: true,
        message: "Photo deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting photo:", error);
      return NextResponse.json(
        { error: "Failed to delete photo" },
        { status: 500 }
      );
    }
  }
);
