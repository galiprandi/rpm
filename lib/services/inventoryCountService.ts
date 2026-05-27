/**
 * Inventory Count Service - Logic for cyclic stock counting
 *
 * Especificaciones relacionadas:
 * - /specs/features/cyclic-count.md
 * - /specs/features/products-and-inventory.md
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { adjustStock } from './productService';

export type OperativeStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'CANCELLED';

export interface InventoryCountOperative {
  id: string;
  status: OperativeStatus;
  itemCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  finishedAt: Date | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  items?: InventoryCountItem[];
}

export interface InventoryCountItem {
  id: string;
  operativeId: string;
  productId: string;
  theoreticalStock: number;
  countedStock: number | null;
  previousLocation: string | null;
  newLocation: string | null;
  isFound: boolean;
  reportedAt: Date | null;
  reportedBy: string | null;
  product?: {
    name: string;
    sku: string | null;
    location: string | null;
  };
}

/**
 * Calculates risk scores and selects X products for a new count operative
 */
export async function getSuggestedProductsForCount(limit: number): Promise<any[]> {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Get all active products
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      location: true,
      lastCountedAt: true,
    }
  });

  // Get high rotation products (more than 10 sales in last 60 days)
  // We check stock_movements of type 'OUT' and reason 'VENTA'
  const salesMovements = await prisma.stock_movement.groupBy({
    by: ['productId'],
    where: {
      type: 'OUT',
      reason: 'VENTA',
      createdAt: { gte: sixtyDaysAgo },
    },
    _count: {
      id: true,
    }
  });

  const highRotationProductIds = new Set(
    salesMovements
      .filter(m => m._count.id > 10)
      .map(m => m.productId)
  );

  const now = new Date();

  const scoredProducts = products.map(product => {
    let score = 0;

    // Never counted
    if (!product.lastCountedAt) {
      score += 100;
    } else {
      // Age score: 1 point per day since last count
      const daysSinceCount = Math.floor((now.getTime() - product.lastCountedAt.getTime()) / (1000 * 60 * 60 * 24));
      score += daysSinceCount;
    }

    // Stock = 1
    if (product.stock === 1) {
      score += 50;
    }

    // No location
    if (!product.location || product.location.trim() === '') {
      score += 30;
    }

    // High rotation
    if (highRotationProductIds.has(product.id)) {
      score += 40;
    }

    return {
      ...product,
      score,
    };
  });

  // Sort by score descending and take X
  return scoredProducts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Creates a new count operative
 */
export async function createCountOperative(userId: string, productIds: string[]): Promise<InventoryCountOperative> {
  return await prisma.$transaction(async (tx) => {
    const operative = await tx.inventory_count_operative.create({
      data: {
        status: 'PENDING',
        itemCount: productIds.length,
        createdBy: userId,
      }
    });

    const itemsData = await Promise.all(productIds.map(async (productId) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { stock: true, location: true }
      });

      if (!product) throw new Error(`Producto ${productId} no encontrado`);

      return {
        operativeId: operative.id,
        productId,
        theoreticalStock: product.stock,
        previousLocation: product.location,
      };
    }));

    await tx.inventory_count_item.createMany({
      data: itemsData
    });

    return operative as InventoryCountOperative;
  });
}

/**
 * Reports a single item count (Operator view)
 */
export async function reportItemCount(
  itemId: string,
  userId: string,
  data: { isFound: boolean; countedStock?: number; newLocation?: string }
): Promise<void> {
  const item = await prisma.inventory_count_item.findUnique({
    where: { id: itemId },
    include: { operative: true }
  });

  if (!item) throw new Error('Item no encontrado');
  if (item.operative.status !== 'PENDING' && item.operative.status !== 'IN_PROGRESS') {
    throw new Error('El operativo no está en un estado que permita reportes');
  }

  await prisma.$transaction([
    prisma.inventory_count_item.update({
      where: { id: itemId },
      data: {
        isFound: data.isFound,
        countedStock: data.isFound ? (data.countedStock ?? 0) : 0,
        newLocation: data.newLocation || null,
        reportedAt: new Date(),
        reportedBy: userId,
      }
    }),
    prisma.inventory_count_operative.update({
      where: { id: item.operativeId },
      data: { status: 'IN_PROGRESS' }
    })
  ]);

  // Check if all items are reported
  const remaining = await prisma.inventory_count_item.count({
    where: {
      operativeId: item.operativeId,
      reportedAt: null
    }
  });

  if (remaining === 0) {
    await prisma.inventory_count_operative.update({
      where: { id: item.operativeId },
      data: {
        status: 'COMPLETED',
        finishedAt: new Date()
      }
    });
  }
}

/**
 * Gets operative details with items and concurrent movement alerts
 */
export async function getOperativeDetails(operativeId: string) {
  const operative = await prisma.inventory_count_operative.findUnique({
    where: { id: operativeId },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              location: true,
              stock: true,
            }
          }
        }
      }
    }
  });

  if (!operative) return null;

  // Enhance items with concurrent movement alerts
  const enhancedItems = await Promise.all(operative.items.map(async (item) => {
    // Movements between operative creation and now
    const movements = await prisma.stock_movement.findMany({
      where: {
        productId: item.productId,
        createdAt: { gte: operative.createdAt },
        // Exclude movements created by this specific operative if we were re-approving (not applicable here but good practice)
      }
    });

    const netMovement = movements.reduce((acc, mov) => {
      if (mov.type === 'IN') return acc + Math.abs(mov.quantity);
      if (mov.type === 'OUT') return acc - Math.abs(mov.quantity);
      return acc + mov.quantity; // ADJUSTMENT can be pos or neg
    }, 0);

    const salesQuantity = movements
      .filter(m => m.reason === 'VENTA' || m.type === 'OUT')
      .reduce((acc, mov) => acc + Math.abs(mov.quantity), 0);

    return {
      ...item,
      concurrentMovement: netMovement,
      salesDuringCount: salesQuantity,
      currentTheoreticalStock: item.product.stock,
      // Suggested value: if operator found X, and since then we sold Y,
      // the new stock should be X - Y (if we consider operator count as the truth at that moment)
      // Actually, if operator counted X at T1, and we are at T2.
      // Theoretical at T1 was T1_stock.
      // Theoretical at T2 is T1_stock + netMovement.
      // Suggested Adjustment: Operator count X + (Theoretical_T2 - Theoretical_T1)
      suggestedStock: item.countedStock !== null ? item.countedStock + (item.product.stock - item.theoreticalStock) : item.product.stock,
    };
  }));

  return {
    ...operative,
    items: enhancedItems
  };
}

/**
 * Approves and applies the count adjustments
 */
export async function approveOperative(
  operativeId: string,
  userId: string,
  adjustments: { itemId: string; finalStock: number; finalLocation?: string }[]
): Promise<void> {
  const operative = await prisma.inventory_count_operative.findUnique({
    where: { id: operativeId },
    include: { items: true }
  });

  if (!operative || operative.status !== 'COMPLETED') {
    throw new Error('Operativo no encontrado o no está completado');
  }

  const user = await prisma.user_role.findFirst({
    where: { id: userId }
  });

  const userName = user?.name || 'Admin';

  await prisma.$transaction(async (tx) => {
    for (const adj of adjustments) {
      const item = operative.items.find(i => i.id === adj.itemId);
      if (!item) continue;

      // Apply stock adjustment using the centralized adjustStock logic
      // We use 'set' because we are saying "this is the real stock now"
      await adjustStock(
        item.productId,
        'set',
        adj.finalStock,
        userId,
        userName,
        'AJUSTE_INVENTARIO',
        `Ajuste por Conteo Cíclico (Op: ${operativeId})`
      );

      // Update product location if provided
      if (adj.finalLocation !== undefined) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            location: adj.finalLocation,
            lastCountedAt: new Date()
          }
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { lastCountedAt: new Date() }
        });
      }
    }

    await tx.inventory_count_operative.update({
      where: { id: operativeId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: userId
      }
    });
  });
}
