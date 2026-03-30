import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const normalizeText = (text: string): string => text.trim().toLowerCase();
const capitalizeText = (text: string): string =>
  text.trim().replace(/\b\w/g, (char) => char.toUpperCase());

// GET /api/work-orders - List work orders with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const vehicleId = searchParams.get("vehicleId");
    const technicianId = searchParams.get("technicianId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (vehicleId) where.vehicleId = vehicleId;
    if (technicianId) where.technicianId = technicianId;

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
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
        items: {
          include: {
            product: true,
            service: true,
          },
        },
        _count: {
          select: {
            photos: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.workOrder.count({ where });

    return NextResponse.json({ workOrders, total, limit, offset });
  } catch (error) {
    console.error("Error fetching work orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch work orders" },
      { status: 500 }
    );
  }
}

// POST /api/work-orders - Create work order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      vehicleData,
      technicianId,
      items,
      entryChecklist,
      notes,
      scheduledDate,
    } = body;

    if (!customerId || !vehicleData) {
      return NextResponse.json(
        { error: "Missing required fields: customerId, vehicleData" },
        { status: 400 }
      );
    }

    const { identifier, category, makeName, modelName, year, color, equipmentName, equipmentType, description } = vehicleData;

    // 1. Find or create VehicleMake (only for vehicles, not equipment)
    let makeId = null;
    let modelId = null;

    const isVehicle = ["CAR", "TRUCK", "SUV", "PICKUP", "MOTORCYCLE", "TRAILER"].includes(category);

    if (isVehicle && makeName) {
      const normalizedMakeName = normalizeText(makeName);
      let make = await prisma.vehicleMake.findUnique({
        where: { normalizedName: normalizedMakeName },
      });

      if (!make) {
        make = await prisma.vehicleMake.create({
          data: {
            name: capitalizeText(makeName),
            normalizedName: normalizedMakeName,
            category: [category],
          },
        });
      }
      makeId = make.id;

      // 2. Find or create VehicleModel
      if (modelName) {
        const normalizedModelName = normalizeText(modelName);
        let model = await prisma.vehicleModel.findFirst({
          where: {
            makeId: make.id,
            normalizedName: normalizedModelName,
          },
        });

        if (!model) {
          model = await prisma.vehicleModel.create({
            data: {
              makeId: make.id,
              name: capitalizeText(modelName),
              normalizedName: normalizedModelName,
              years: year ? [year] : [],
            },
          });
        } else if (year && !model.years.includes(year)) {
          model = await prisma.vehicleModel.update({
            where: { id: model.id },
            data: { years: { push: year } },
          });
        }
        modelId = model.id;
      }
    }

    // 3. Find or create Vehicle
    let vehicle = await prisma.vehicle.findFirst({
      where: {
        identifier: identifier.toUpperCase(),
        customerId,
      },
    });

    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          identifier: identifier.toUpperCase(),
          category,
          customerId,
          makeId,
          modelId,
          year,
          color,
          equipmentName,
          equipmentType,
          description,
        },
      });
    }

    // 4. Calculate totals
    let totalProducts = 0;
    let totalServices = 0;

    const workOrderItems = items?.map((item: { type: string; productId?: string; serviceId?: string; quantity: number; unitPrice: number }) => {
      const subtotal = item.quantity * item.unitPrice;
      if (item.type === "PRODUCT") {
        totalProducts += subtotal;
      } else {
        totalServices += subtotal;
      }
      return {
        type: item.type,
        productId: item.productId,
        serviceId: item.serviceId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal,
      };
    }) || [];

    const total = totalProducts + totalServices;

    // 5. Create WorkOrder
    const workOrder = await prisma.workOrder.create({
      data: {
        customerId,
        vehicleId: vehicle.id,
        technicianId,
        status: scheduledDate ? "CONFIRMED" : "WAITING",
        entryChecklist,
        notes: notes || "",
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        total,
        totalProducts,
        totalServices,
        items: {
          create: workOrderItems,
        },
      },
      include: {
        customer: true,
        vehicle: {
          include: {
            make: true,
            model: true,
          },
        },
        items: {
          include: {
            product: true,
            service: true,
          },
        },
      },
    });

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating work order:", error);
    return NextResponse.json(
      { error: "Failed to create work order" },
      { status: 500 }
    );
  }
}
