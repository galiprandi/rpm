import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/work-orders/[id]/checklist - Update checklist data (odometer, fuel level)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, odometerValue, fuelLevel } = body;

    if (!type || !["ENTRY", "EXIT"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be ENTRY or EXIT" },
        { status: 400 }
      );
    }

    // Update the checklist JSON with odometer and fuel level
    const workOrder = await prisma.work_order.findUnique({
      where: { id },
      select: { entryChecklist: true, exitChecklist: true },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );
    }

    const currentChecklist = type === "ENTRY" ? workOrder.entryChecklist : workOrder.exitChecklist;
    const updatedChecklist = {
      ...((currentChecklist || {}) as Record<string, unknown>),
      odometerValue,
      fuelLevel,
    };

    const updateData =
      type === "ENTRY"
        ? { entryChecklist: updatedChecklist }
        : { exitChecklist: updatedChecklist };

    const updatedWorkOrder = await prisma.work_order.update({
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

    return NextResponse.json(updatedWorkOrder);
  } catch (error) {
    console.error("Error updating checklist data:", error);
    return NextResponse.json(
      { error: "Failed to update checklist data" },
      { status: 500 }
    );
  }
}

// POST /api/work-orders/[id]/checklist - Update checklist
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
        ? { entryChecklist: checklistData }
        : { exitChecklist: checklistData };

    const workOrder = await prisma.work_order.update({
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
