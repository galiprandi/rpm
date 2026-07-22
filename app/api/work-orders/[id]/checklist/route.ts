import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workOrder } from "@/db/schema";
import { eq } from "drizzle-orm";

// PUT /api/work-orders/[id]/checklist - Update checklist data (items, notes, odometer, fuel level)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, items, notes, odometerValue, fuelLevel } = body;

    if (!type || !["ENTRY", "EXIT"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be ENTRY or EXIT" },
        { status: 400 }
      );
    }

    // Get current checklist to merge
    const workOrderRecord = await db.query.workOrder.findFirst({
      where: eq(workOrder.id, id),
      columns: { entryChecklist: true, exitChecklist: true },
    });

    if (!workOrderRecord) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );
    }

    const currentChecklist = (type === "ENTRY" ? workOrderRecord.entryChecklist : workOrderRecord.exitChecklist) || {};

    // Merge updates
    const updatedChecklist = {
      ...(currentChecklist as Record<string, unknown>),
    };

    if (items !== undefined) updatedChecklist.items = items;
    if (notes !== undefined) updatedChecklist.notes = notes;
    if (odometerValue !== undefined) updatedChecklist.odometerValue = odometerValue;
    if (fuelLevel !== undefined) updatedChecklist.fuelLevel = fuelLevel;

    const updateData =
      type === "ENTRY"
        ? { entryChecklist: updatedChecklist as any }
        : { exitChecklist: updatedChecklist as any };

    await db.update(workOrder).set(updateData).where(eq(workOrder.id, id));

    // Fetch with relations
    const updatedWorkOrder = await db.query.workOrder.findFirst({
      where: eq(workOrder.id, id),
      with: {
        customer: {
          columns: {
            id: true,
            name: true,
            phone: true,
          },
        },
        vehicle: {
          columns: {
            id: true,
            identifier: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(updatedWorkOrder);
  } catch (error) {
    console.error("Error updating checklist data:", error);
    return NextResponse.json(
      { error: "Failed to update checklist data" },
      { status: 500 }
    );
  }
}

// POST /api/work-orders/[id]/checklist - Initialize/Complete checklist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, items, notes, odometerValue, fuelLevel } = body;

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
      odometerValue,
      fuelLevel,
    };

    const updateData =
      type === "ENTRY"
        ? { entryChecklist: checklistData as any }
        : { exitChecklist: checklistData as any };

    await db.update(workOrder).set(updateData).where(eq(workOrder.id, id));

    // Fetch with relations
    const workOrderRecord = await db.query.workOrder.findFirst({
      where: eq(workOrder.id, id),
      with: {
        customer: {
          columns: {
            id: true,
            name: true,
            phone: true,
          },
        },
        vehicle: {
          columns: {
            id: true,
            identifier: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(workOrderRecord);
  } catch (error) {
    console.error("Error updating checklist:", error);
    return NextResponse.json(
      { error: "Failed to update checklist" },
      { status: 500 }
    );
  }
}
