import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/work-orders/[id]/photos - Add photos to work order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

// GET /api/work-orders/[id]/photos - Get photos for work order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
