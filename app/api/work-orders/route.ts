import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

const normalizeText = (text: string): string => text.trim().toLowerCase();
const capitalizeText = (text: string): string =>
  text.trim().replace(/\b\w/g, (char) => char.toUpperCase());

// GET /api/work-orders - List work orders with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
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

    const workOrders = await prisma.work_order.findMany({
      where,
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
            vehicle_make: {
              select: {
                id: true,
                name: true,
              },
            },
            vehicle_model: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        work_order_item: {
          include: {
            product: true,
            service: true,
          },
        },
        photo: true,
        payments: {
          select: {
            amount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.work_order.count({ where });

    // Calculate payment status for each work order
    const workOrdersWithPaymentStatus = workOrders.map((wo) => {
      const totalPaid = wo.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      return {
        ...wo,
        totalPaid,
        isFullyPaid: totalPaid >= Number(wo.total),
      };
    });

    return NextResponse.json({ workOrders: workOrdersWithPaymentStatus, total, limit, offset });
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
      vehicleId,
      vehicleData,
      technicianId,
      items,
      entryChecklist,
      odometerValue,
      fuelLevel,
      notes,
      scheduledDate,
      source = "IN_PERSON",
    } = body;

    if (!customerId || (!vehicleId && !vehicleData)) {
      return NextResponse.json(
        { error: "Missing required fields: customerId, vehicleId or vehicleData" },
        { status: 400 }
      );
    }

    let vehicle;

    // If vehicleId is provided, use existing vehicle
    if (vehicleId) {
      vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        return NextResponse.json(
          { error: "Vehicle not found" },
          { status: 404 }
        );
      }

      // Verify vehicle belongs to customer
      if (vehicle.customerId !== customerId) {
        return NextResponse.json(
          { error: "Vehicle does not belong to customer" },
          { status: 400 }
        );
      }
    } else if (vehicleData) {
      // Create or find vehicle from vehicleData
      const { identifier, category, makeName, modelName, year, color, equipmentName, equipmentType, description } = vehicleData;

      // 1. Find or create VehicleMake (only for vehicles, not equipment)
      let makeId = null;
      let modelId = null;

      const isVehicle = ["CAR", "TRUCK", "SUV", "PICKUP", "MOTORCYCLE", "TRAILER"].includes(category);

      if (isVehicle && makeName) {
        const normalizedMakeName = normalizeText(makeName);
        let make = await prisma.vehicle_make.findUnique({
          where: { normalizedName: normalizedMakeName },
        });

        if (!make) {
          make = await prisma.vehicle_make.create({
            data: {
              id: randomUUID(),
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
          let model = await prisma.vehicle_model.findFirst({
            where: {
              makeId: make.id,
              normalizedName: normalizedModelName,
            },
          });

          if (!model) {
            model = await prisma.vehicle_model.create({
              data: {
                id: randomUUID(),
                makeId: make.id,
                name: capitalizeText(modelName),
                normalizedName: normalizedModelName,
                years: year ? [year] : [],
              },
            });
          } else if (year && !model.years.includes(year)) {
            model = await prisma.vehicle_model.update({
              where: { id: model.id },
              data: { years: { push: year } },
            });
          }
          modelId = model.id;
        }
      }

      // 3. Find or create Vehicle
      vehicle = await prisma.vehicle.findFirst({
        where: {
          identifier: identifier.toUpperCase(),
          customerId,
        },
      });

      if (!vehicle) {
        vehicle = await prisma.vehicle.create({
          data: {
            id: randomUUID(),
            identifier: identifier.toUpperCase(),
            category,
            customerId,
            makeId: makeId || null,
            modelId: modelId || null,
            year: year || null,
            color: color || null,
            equipmentName: equipmentName || null,
            equipmentType: equipmentType || null,
            description: description || null,
            updatedAt: new Date(),
          },
        });
      }
    }

    // Ensure vehicle was resolved
    if (!vehicle) {
      return NextResponse.json(
        { error: "Failed to resolve vehicle" },
        { status: 500 }
      );
    }

    // 4. Calculate totals
    let totalProducts = 0;
    let totalServices = 0;

    const workOrderItems = items?.map((item: { type: string; productId?: string; serviceId?: string; quantity: number; unitPrice: number; priceListId?: string; isManualPrice?: boolean }) => {
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
    console.log("Creating WorkOrder with data:", {
      customerId,
      vehicleId: vehicle.id,
      technicianId,
      status: scheduledDate ? "CONFIRMED" : "WAITING",
      source,
      entryChecklist,
      odometerValue: odometerValue || null,
      fuelLevel: fuelLevel || null,
      notes: notes || "",
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      total,
      totalProducts,
      totalServices,
    });

    const workOrder = await prisma.work_order.create({
      data: {
        id: randomUUID(),
        customerId,
        vehicleId: vehicle.id,
        technicianId,
        status: scheduledDate ? "CONFIRMED" : "WAITING",
        source,
        entryChecklist,
        odometerValue: odometerValue || null,
        fuelLevel: fuelLevel || null,
        notes: notes || "",
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        total,
        totalProducts,
        totalServices,
        updatedAt: new Date(),
      },
      include: {
        customer: true,
        vehicle: {
          include: {
            vehicle_make: true,
            vehicle_model: true,
          },
        },
        work_order_item: {
          include: {
            product: true,
            service: true,
          },
        },
      },
    });

    console.log("WorkOrder created successfully:", workOrder.id);

    // 6. Create WorkOrderItems separately
    if (workOrderItems.length > 0) {
      console.log("Creating WorkOrderItems:", workOrderItems);
      console.log("WorkOrder ID:", workOrder.id);
      
      try {
        await prisma.work_order_item.createMany({
          data: workOrderItems.map((item: { type: string; productId?: string; serviceId?: string; quantity: number; unitPrice: number; subtotal: number }) => ({
            id: crypto.randomUUID(),
            type: item.type,
            productId: item.productId || null,
            serviceId: item.serviceId || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            workOrderId: workOrder.id,
          })),
        });
        console.log("WorkOrderItems created successfully");
      } catch (itemError) {
        console.error("Error creating WorkOrderItems:", itemError);
        // No fallar la creación de la OT, pero loguear el error
      }
    }

    // 7. Update customer balance - add total as debt
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { balance: true },
      });
      
      if (customer) {
        const currentBalance = Number(customer.balance) || 0;
        const newBalance = currentBalance + total;
        
        await prisma.customer.update({
          where: { id: customerId },
          data: { balance: newBalance },
        });
        
        console.log("Customer balance updated:", { customerId, oldBalance: currentBalance, newBalance, added: total });
      }
    } catch (balanceError) {
      console.error("Error updating customer balance:", balanceError);
      // No fallar la creación de la OT, pero loguear el error
    }

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating work order:", error);
    return NextResponse.json(
      { error: "Failed to create work order" },
      { status: 500 }
    );
  }
}
