import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/work-orders/[id]/checklist - Update checklist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, items, notes } = body;

    if (!type || !items) {
      return NextResponse.json(
        { error: "Missing required fields: type, items" },
        { status: 400 }
      );
    }

    if (!["ENTRY", "EXIT"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be ENTRY or EXIT" },
        { status: 400 }
      );
    }

    const checklistData = {
      items,
      notes,
      completedAt: new Date(),
    };

    const updateData =
      type === "ENTRY"
        ? { entryChecklist: checklistData }
        : { exitChecklist: checklistData };

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            identifier: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error("Error updating checklist:", error);
    return NextResponse.json(
      { error: "Failed to update checklist" },
      { status: 500 }
    );
  }
}
