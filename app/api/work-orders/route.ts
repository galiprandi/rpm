import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  workOrder,
  workOrderItem,
  vehicle,
  vehicleMake,
  vehicleModel,
} from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { toISODate } from "@/lib/utils/date";
import { randomUUID } from "crypto";
import { capitalizeText, normalizeText } from "@/lib/utils/format";
import { adjustBalanceAtomically } from "@/lib/services/balanceService";

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
    const conditions = [];
    if (status) conditions.push(eq(workOrder.status, status));
    if (customerId) conditions.push(eq(workOrder.customerId, customerId));
    if (vehicleId) conditions.push(eq(workOrder.vehicleId, vehicleId));
    if (technicianId) conditions.push(eq(workOrder.technicianId, technicianId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const workOrders = await db.query.workOrder.findMany({
      where,
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
          with: {
            vehicleMake: {
              columns: {
                id: true,
                name: true,
              },
            },
            vehicleModel: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
        workOrderItems: {
          with: {
            product: true,
            service: true,
          },
        },
        technician: {
          columns: {
            id: true,
            name: true,
          },
        },
        photos: true,
        payments: {
          columns: {
            amount: true,
            paymentMethodId: true,
          },
        },
      },
      orderBy: desc(workOrder.createdAt),
      limit,
      offset,
    });

    const [{ count: total }] = await db
      .select({ count: count() })
      .from(workOrder)
      .where(where ?? undefined);

    // Calculate payment status for each work order
    const workOrdersWithPaymentStatus = workOrders.map((wo) => {
      const totalPaid = wo.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      return {
        ...wo,
        entryPhotos: wo.entryPhotos || [],
        exitPhotos: wo.exitPhotos || [],
        total: Number(wo.total),
        totalProducts: Number(wo.totalProducts),
        totalServices: Number(wo.totalServices),
        createdAt: toISODate(wo.createdAt),
        updatedAt: toISODate(wo.updatedAt),
        scheduledDate: toISODate(wo.scheduledDate),
        startedAt: toISODate(wo.startedAt),
        completedAt: toISODate(wo.completedAt),
        deliveredAt: toISODate(wo.deliveredAt),
        totalPaid,
        isFullyPaid: totalPaid >= Number(wo.total),
      };
    });

    return NextResponse.json({
      workOrders: workOrdersWithPaymentStatus,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching work orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch work orders" },
      { status: 500 },
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
        {
          error:
            "Missing required fields: customerId, vehicleId or vehicleData",
        },
        { status: 400 },
      );
    }

    let vehicleRecord: typeof vehicle.$inferSelect | undefined;

    // If vehicleId is provided, use existing vehicle
    if (vehicleId) {
      vehicleRecord = await db.query.vehicle.findFirst({
        where: eq(vehicle.id, vehicleId),
      });

      if (!vehicleRecord) {
        return NextResponse.json(
          { error: "Vehicle not found" },
          { status: 404 },
        );
      }

      // Verify vehicle belongs to customer
      if (vehicleRecord.customerId !== customerId) {
        return NextResponse.json(
          { error: "Vehicle does not belong to customer" },
          { status: 400 },
        );
      }
    } else if (vehicleData) {
      // Create or find vehicle from vehicleData
      const {
        identifier,
        category,
        makeName,
        modelName,
        year,
        color,
        equipmentName,
        equipmentType,
        description,
      } = vehicleData;

      // 1. Find or create VehicleMake (only for vehicles, not equipment)
      let makeId = null;
      let modelId = null;

      const isVehicle = [
        "CAR",
        "TRUCK",
        "SUV",
        "PICKUP",
        "MOTORCYCLE",
        "TRAILER",
      ].includes(category);

      if (isVehicle && makeName) {
        const normalizedMakeName = normalizeText(makeName);
        let make = await db.query.vehicleMake.findFirst({
          where: eq(vehicleMake.normalizedName, normalizedMakeName),
        });

        if (!make) {
          const [createdMake] = await db.insert(vehicleMake).values({
            id: randomUUID(),
            name: capitalizeText(makeName),
            normalizedName: normalizedMakeName,
            category: [category],
          }).returning();
          make = createdMake;
        }
        makeId = make.id;

        // 2. Find or create VehicleModel
        if (modelName) {
          const normalizedModelName = normalizeText(modelName);
          let model = await db.query.vehicleModel.findFirst({
            where: and(
              eq(vehicleModel.makeId, make.id),
              eq(vehicleModel.normalizedName, normalizedModelName),
            ),
          });

          if (!model) {
            const [createdModel] = await db.insert(vehicleModel).values({
              id: randomUUID(),
              makeId: make.id,
              name: capitalizeText(modelName),
              normalizedName: normalizedModelName,
              years: year ? [year] : [],
            }).returning();
            model = createdModel;
          } else if (year && !(model.years || []).includes(year)) {
            const [updatedModel] = await db.update(vehicleModel)
              .set({
                years: [...(model.years || []), year],
              })
              .where(eq(vehicleModel.id, model.id))
              .returning();
            model = updatedModel;
          }
          modelId = model.id;
        }
      }

      // 3. Find or create Vehicle
      vehicleRecord = await db.query.vehicle.findFirst({
        where: and(
          eq(vehicle.identifier, identifier.toUpperCase()),
          eq(vehicle.customerId, customerId),
        ),
      });

      if (!vehicleRecord) {
        const [createdVehicle] = await db.insert(vehicle).values({
          id: randomUUID(),
          identifier: identifier.toUpperCase(),
          category,
          customerId,
          makeId: makeId || null,
          modelId: modelId || null,
          year: year || null,
          color: color ? capitalizeText(color) : null,
          equipmentName: equipmentName || null,
          equipmentType: equipmentType || null,
          description: description || null,
          updatedAt: new Date().toISOString(),
        }).returning();
        vehicleRecord = createdVehicle;
      }
    }

    // Ensure vehicle was resolved
    if (!vehicleRecord) {
      return NextResponse.json(
        { error: "Failed to resolve vehicle" },
        { status: 500 },
      );
    }

    // 4. Calculate totals
    let totalProducts = 0;
    let totalServices = 0;

    const workOrderItemsData =
      items?.map(
        (item: {
          type: string;
          productId?: string;
          serviceId?: string;
          name?: string;
          isManualName?: boolean;
          quantity: number;
          unitPrice: number;
          priceListId?: string;
          isManualPrice?: boolean;
        }) => {
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
            name: item.name || null,
            isManualName: item.isManualName || false,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal,
          };
        },
      ) || [];

    const total = totalProducts + totalServices;

    // 5. Create WorkOrder
    console.log("Creating WorkOrder with data:", {
      customerId,
      vehicleId: vehicleRecord.id,
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

    const [createdWorkOrder] = await db.insert(workOrder).values({
      id: randomUUID(),
      customerId,
      vehicleId: vehicleRecord.id,
      technicianId,
      status: scheduledDate ? "CONFIRMED" : "WAITING",
      source,
      entryChecklist,
      odometerValue: odometerValue || null,
      fuelLevel: fuelLevel || null,
      notes: notes || "",
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
      total: String(total),
      totalProducts: String(totalProducts),
      totalServices: String(totalServices),
      updatedAt: new Date().toISOString(),
    }).returning();

    console.log("WorkOrder created successfully:", createdWorkOrder.id);

    // 6. Create WorkOrderItems separately
    if (workOrderItemsData.length > 0) {
      console.log("Creating WorkOrderItems:", workOrderItemsData);
      console.log("WorkOrder ID:", createdWorkOrder.id);

      try {
        await db.insert(workOrderItem).values(
          workOrderItemsData.map(
            (item: {
              type: string;
              productId?: string;
              serviceId?: string;
              name?: string | null;
              isManualName?: boolean;
              quantity: number;
              unitPrice: number;
              subtotal: number;
            }) => ({
              id: crypto.randomUUID(),
              type: item.type,
              productId: item.productId || null,
              serviceId: item.serviceId || null,
              name: item.name || null,
              isManualName: item.isManualName || false,
              quantity: item.quantity,
              unitPrice: String(item.unitPrice),
              subtotal: String(item.subtotal),
              workOrderId: createdWorkOrder.id,
            }),
          ),
        );
        console.log("WorkOrderItems created successfully");
      } catch (itemError) {
        console.error("Error creating WorkOrderItems:", itemError);
        // No fallar la creación de la OT, pero loguear el error
      }
    }

    // 7. Update customer balance atomically
    try {
      await adjustBalanceAtomically(customerId, total, "work_order_create");
    } catch (balanceError) {
      console.error("Error updating customer balance:", balanceError);
    }

    // Fetch with relations
    const workOrderWithRelations = await db.query.workOrder.findFirst({
      where: eq(workOrder.id, createdWorkOrder.id),
      with: {
        customer: true,
        vehicle: {
          with: {
            vehicleMake: true,
            vehicleModel: true,
          },
        },
        workOrderItems: {
          with: {
            product: true,
            service: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...workOrderWithRelations,
      entryPhotos: workOrderWithRelations?.entryPhotos || [],
      exitPhotos: workOrderWithRelations?.exitPhotos || [],
      total: workOrderWithRelations ? Number(workOrderWithRelations.total) : undefined,
      totalProducts: workOrderWithRelations ? Number(workOrderWithRelations.totalProducts) : undefined,
      totalServices: workOrderWithRelations ? Number(workOrderWithRelations.totalServices) : undefined,
      createdAt: toISODate(workOrderWithRelations?.createdAt),
      updatedAt: toISODate(workOrderWithRelations?.updatedAt),
      scheduledDate: toISODate(workOrderWithRelations?.scheduledDate),
      startedAt: toISODate(workOrderWithRelations?.startedAt),
      completedAt: toISODate(workOrderWithRelations?.completedAt),
      deliveredAt: toISODate(workOrderWithRelations?.deliveredAt),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating work order:", error);
    return NextResponse.json(
      { error: "Failed to create work order" },
      { status: 500 },
    );
  }
}
