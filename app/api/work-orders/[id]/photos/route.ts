import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
      const photo = await prisma.photo.create({
        data: {
          id: crypto.randomUUID(),
          workOrderId: id,
          type,
          url,
          description,
        },
      });

      // Update work order photo arrays
      if (type === "ENTRY") {
        await prisma.work_order.update({
          where: { id },
          data: {
            entryPhotos: { push: url },
          },
        });
      } else {
        await prisma.work_order.update({
          where: { id },
          data: {
            exitPhotos: { push: url },
          },
        });
      }

      return NextResponse.json(photo, { status: 201 });
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

      const where: Record<string, unknown> = { workOrderId: id };
      if (type) where.type = type;

      const photos = await prisma.photo.findMany({
        where,
        orderBy: { createdAt: "desc" },
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
        photoRecord = await prisma.photo.findUnique({
          where: { id: photoId },
        });
      } else if (url) {
        photoRecord = await prisma.photo.findFirst({
          where: { workOrderId: id, url },
        });
      }

      if (!photoRecord) {
        // Fallback: if no photo record found in DB but url is provided, remove url from the arrays of work_order anyway.
        if (url) {
          const wo = await prisma.work_order.findUnique({
            where: { id },
            select: { entryPhotos: true, exitPhotos: true },
          });
          if (wo) {
            const entryPhotos = wo.entryPhotos.filter((p) => p !== url);
            const exitPhotos = wo.exitPhotos.filter((p) => p !== url);
            await prisma.work_order.update({
              where: { id },
              data: { entryPhotos, exitPhotos },
            });
          }
          return NextResponse.json({
            success: true,
            message: "Photo URL removed from arrays",
          });
        }
        return NextResponse.json({ error: "Photo not found" }, { status: 404 });
      }

      // Delete photo record from DB
      await prisma.photo.delete({
        where: { id: photoRecord.id },
      });

      // Update work order arrays
      const wo = await prisma.work_order.findUnique({
        where: { id },
        select: { entryPhotos: true, exitPhotos: true },
      });

      if (wo) {
        if (photoRecord.type === "ENTRY") {
          const entryPhotos = wo.entryPhotos.filter((p) => p !== photoRecord.url);
          await prisma.work_order.update({
            where: { id },
            data: { entryPhotos },
          });
        } else {
          const exitPhotos = wo.exitPhotos.filter((p) => p !== photoRecord.url);
          await prisma.work_order.update({
            where: { id },
            data: { exitPhotos },
          });
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
