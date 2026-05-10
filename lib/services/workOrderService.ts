import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { capitalizeText, normalizeText } from '@/lib/utils/format';
import { invalidateDashboard } from '@/lib/cache';
import { logWorkOrderChange } from './auditService';

export interface WorkOrderFilters {
  status?: string;
  customerId?: string;
  vehicleId?: string;
  technicianId?: string;
  limit?: number;
  offset?: number;
}

export interface CreateWorkOrderInput {
  customerId: string;
  vehicleId?: string;
  vehicleData?: {
    identifier: string;
    category: string;
    makeName?: string;
    modelName?: string;
    year?: number;
    color?: string;
    equipmentName?: string;
    equipmentType?: string;
    description?: string;
  };
  technicianId?: string;
  items?: Array<{
    type: 'PRODUCT' | 'SERVICE';
    productId?: string;
    serviceId?: string;
    quantity: number;
    unitPrice: number;
  }>;
  entryChecklist?: any;
  odometerValue?: number;
  fuelLevel?: number;
  notes?: string;
  scheduledDate?: string;
  source?: string;
}

export interface UpdateWorkOrderInput {
  technicianId?: string;
  status?: string;
  entryChecklist?: any;
  exitChecklist?: any;
  notes?: string;
  paymentMethod?: string;
  paymentNotes?: string;
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  deliveredAt?: string;
  changedBy?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function getWorkOrders(filters: WorkOrderFilters) {
  const { status, customerId, vehicleId, technicianId, limit = 50, offset = 0 } = filters;

  const where: Record<string, any> = {};
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
            select: { id: true, name: true },
          },
          vehicle_model: {
            select: { id: true, name: true },
          },
        },
      },
      payments: {
        select: {
          amount: true,
          paymentMethodId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  const total = await prisma.work_order.count({ where });

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

  return { workOrders: workOrdersWithPaymentStatus, total };
}

export async function getWorkOrderById(id: string) {
  return prisma.work_order.findUnique({
    where: { id },
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
      photo: true,
    },
  });
}

export async function createWorkOrder(input: CreateWorkOrderInput) {
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
    source = 'IN_PERSON',
  } = input;

  return await prisma.$transaction(async (tx) => {
    let finalVehicleId = vehicleId;

    if (!finalVehicleId && vehicleData) {
      const { identifier, category, makeName, modelName, year, color, equipmentName, equipmentType, description } = vehicleData;

      let makeId = null;
      let modelId = null;

      const isVehicle = ['CAR', 'TRUCK', 'SUV', 'PICKUP', 'MOTORCYCLE', 'TRAILER'].includes(category);

      if (isVehicle && makeName) {
        const normalizedMakeName = normalizeText(makeName);
        let make = await tx.vehicle_make.findUnique({
          where: { normalizedName: normalizedMakeName },
        });

        if (!make) {
          make = await tx.vehicle_make.create({
            data: {
              id: randomUUID(),
              name: capitalizeText(makeName),
              normalizedName: normalizedMakeName,
              category: [category],
            },
          });
        }
        makeId = make.id;

        if (modelName) {
          const normalizedModelName = normalizeText(modelName);
          let model = await tx.vehicle_model.findFirst({
            where: {
              makeId: make.id,
              normalizedName: normalizedModelName,
            },
          });

          if (!model) {
            model = await tx.vehicle_model.create({
              data: {
                id: randomUUID(),
                makeId: make.id,
                name: capitalizeText(modelName),
                normalizedName: normalizedModelName,
                years: year ? [year] : [],
              },
            });
          } else if (year && !model.years.includes(year)) {
            await tx.vehicle_model.update({
              where: { id: model.id },
              data: { years: { push: year } },
            });
          }
          modelId = model.id;
        }
      }

      let vehicle = await tx.vehicle.findFirst({
        where: {
          identifier: identifier.toUpperCase(),
          customerId,
        },
      });

      if (!vehicle) {
        vehicle = await tx.vehicle.create({
          data: {
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
            updatedAt: new Date(),
          },
        });
      }
      finalVehicleId = vehicle.id;
    }

    if (!finalVehicleId) throw new Error('Failed to resolve vehicle');

    let totalProducts = 0;
    let totalServices = 0;

    const workOrderItemsData = items?.map((item) => {
      const subtotal = item.quantity * item.unitPrice;
      if (item.type === 'PRODUCT') {
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

    const workOrder = await tx.work_order.create({
      data: {
        id: randomUUID(),
        customerId,
        vehicleId: finalVehicleId,
        technicianId,
        status: scheduledDate ? 'CONFIRMED' : 'WAITING',
        source,
        entryChecklist,
        odometerValue: odometerValue || null,
        fuelLevel: fuelLevel || null,
        notes: notes || '',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        total,
        totalProducts,
        totalServices,
        updatedAt: new Date(),
      },
    });

    if (workOrderItemsData.length > 0) {
      await tx.work_order_item.createMany({
        data: workOrderItemsData.map((item) => ({
          id: randomUUID(),
          workOrderId: workOrder.id,
          ...item,
        })),
      });
    }

    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      select: { balance: true },
    });

    if (customer) {
      await tx.customer.update({
        where: { id: customerId },
        data: { balance: Number(customer.balance) + total },
      });
    }

    invalidateDashboard();
    return workOrder;
  });
}

export async function updateWorkOrder(id: string, input: UpdateWorkOrderInput) {
  const {
    technicianId,
    status,
    entryChecklist,
    exitChecklist,
    notes,
    paymentMethod,
    paymentNotes,
    scheduledDate,
    startedAt,
    completedAt,
    deliveredAt,
    changedBy = 'system',
    ipAddress,
    userAgent,
  } = input;

  const currentWorkOrder = await prisma.work_order.findUnique({
    where: { id },
    select: {
      status: true,
      notes: true,
      scheduledDate: true,
      paymentMethod: true,
      paymentNotes: true,
    },
  });

  if (!currentWorkOrder) throw new Error('Work order not found');

  const trackedFields = [
    { name: 'status', current: currentWorkOrder.status, new: status },
    { name: 'notes', current: currentWorkOrder.notes, new: notes },
    { name: 'scheduledDate', current: currentWorkOrder.scheduledDate?.toISOString(), new: scheduledDate },
    { name: 'paymentMethod', current: currentWorkOrder.paymentMethod, new: paymentMethod },
    { name: 'paymentNotes', current: currentWorkOrder.paymentNotes, new: paymentNotes },
  ];

  for (const field of trackedFields) {
    if (field.new !== undefined && String(field.current) !== String(field.new)) {
      await logWorkOrderChange({
        workOrderId: id,
        fieldName: field.name,
        oldValue: field.current ? String(field.current) : null,
        newValue: field.new ? String(field.new) : null,
        changedBy,
        ipAddress,
        userAgent,
      });
    }
  }

  const updated = await prisma.work_order.update({
    where: { id },
    data: {
      technicianId,
      status,
      entryChecklist,
      exitChecklist,
      notes,
      paymentMethod,
      paymentNotes,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      startedAt: startedAt ? new Date(startedAt) : undefined,
      completedAt: completedAt ? new Date(completedAt) : undefined,
      deliveredAt: deliveredAt ? new Date(deliveredAt) : undefined,
    },
  });

  invalidateDashboard();
  return updated;
}

export async function deleteWorkOrder(id: string) {
  const result = await prisma.work_order.delete({
    where: { id },
  });
  invalidateDashboard();
  return result;
}
