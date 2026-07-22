/**
 * Inventory Count Service - Logic for cyclic stock counting
 *
 * Especificaciones relacionadas:
 * - /specs/features/cyclic-count.md
 * - /specs/features/products-and-inventory.md
 */

import { db } from '@/lib/db';
import {
  product,
  stockMovement,
  inventoryCountOperative,
  inventoryCountItem,
  userRole,
} from '@/db/schema';
import { eq, and, gte, isNull, sql } from 'drizzle-orm';
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
  const products = await db.query.product.findMany({
    where: eq(product.isActive, true),
    columns: {
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
  const salesMovements = await db
    .select({
      productId: stockMovement.productId,
      count: sql<number>`count(*)::int`,
    })
    .from(stockMovement)
    .where(and(
      eq(stockMovement.type, 'OUT'),
      eq(stockMovement.reason, 'VENTA'),
      gte(stockMovement.createdAt, sixtyDaysAgo.toISOString()),
    ))
    .groupBy(stockMovement.productId);

  const highRotationProductIds = new Set(
    salesMovements
      .filter(m => m.count > 10)
      .map(m => m.productId)
  );

  const now = new Date();

  const scoredProducts = products.map(prod => {
    let score = 0;

    // Never counted
    if (!prod.lastCountedAt) {
      score += 100;
    } else {
      // Age score: 1 point per day since last count
      const daysSinceCount = Math.floor((now.getTime() - new Date(prod.lastCountedAt).getTime()) / (1000 * 60 * 60 * 24));
      score += daysSinceCount;
    }

    // Stock = 1
    if (prod.stock === 1) {
      score += 50;
    }

    // No location
    if (!prod.location || prod.location.trim() === '') {
      score += 30;
    }

    // High rotation
    if (highRotationProductIds.has(prod.id)) {
      score += 40;
    }

    return {
      ...prod,
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
  return await db.transaction(async (tx) => {
    const [operative] = await tx.insert(inventoryCountOperative).values({
      status: 'PENDING',
      itemCount: productIds.length,
      createdBy: userId,
      updatedAt: new Date().toISOString(),
    }).returning();

    const itemsData = await Promise.all(productIds.map(async (productId) => {
      const prod = await tx.query.product.findFirst({
        where: eq(product.id, productId),
        columns: { stock: true, location: true }
      });

      if (!prod) throw new Error(`Producto ${productId} no encontrado`);

      return {
        operativeId: operative.id,
        productId,
        theoreticalStock: prod.stock,
        previousLocation: prod.location,
      };
    }));

    await tx.insert(inventoryCountItem).values(itemsData);

    return operative as unknown as InventoryCountOperative;
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
  const item = await db.query.inventoryCountItem.findFirst({
    where: eq(inventoryCountItem.id, itemId),
    with: { inventoryCountOperative: true }
  });

  if (!item) throw new Error('Item no encontrado');
  if (item.inventoryCountOperative.status !== 'PENDING' && item.inventoryCountOperative.status !== 'IN_PROGRESS') {
    throw new Error('El operativo no está en un estado que permita reportes');
  }

  await db.transaction(async (tx) => {
    await tx.update(inventoryCountItem)
      .set({
        isFound: data.isFound,
        countedStock: data.isFound ? (data.countedStock ?? 0) : 0,
        newLocation: data.newLocation || null,
        reportedAt: new Date().toISOString(),
        reportedBy: userId,
      })
      .where(eq(inventoryCountItem.id, itemId));

    await tx.update(inventoryCountOperative)
      .set({ status: 'IN_PROGRESS' })
      .where(eq(inventoryCountOperative.id, item.operativeId));
  });

  // Check if all items are reported
  const remaining = await db.select({ count: sql<number>`count(*)::int` })
    .from(inventoryCountItem)
    .where(and(
      eq(inventoryCountItem.operativeId, item.operativeId),
      isNull(inventoryCountItem.reportedAt),
    ));

  if (remaining[0]?.count === 0) {
    await db.update(inventoryCountOperative)
      .set({
        status: 'COMPLETED',
        finishedAt: new Date().toISOString()
      })
      .where(eq(inventoryCountOperative.id, item.operativeId));
  }
}

/**
 * Gets operative details with items and concurrent movement alerts
 */
export async function getOperativeDetails(operativeId: string) {
  const operative = await db.query.inventoryCountOperative.findFirst({
    where: eq(inventoryCountOperative.id, operativeId),
    with: {
      inventoryCountItems: {
        with: {
          product: {
            columns: {
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
  const enhancedItems = await Promise.all(operative.inventoryCountItems.map(async (item) => {
    // Movements between operative creation and now
    const movements = await db.query.stockMovement.findMany({
      where: and(
        eq(stockMovement.productId, item.productId),
        gte(stockMovement.createdAt, operative.createdAt),
      )
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
  const operative = await db.query.inventoryCountOperative.findFirst({
    where: eq(inventoryCountOperative.id, operativeId),
    with: { inventoryCountItems: true }
  });

  if (!operative || operative.status !== 'COMPLETED') {
    throw new Error('Operativo no encontrado o no está completado');
  }

  const userRecord = await db.query.userRole.findFirst({
    where: eq(userRole.id, userId)
  });

  const userName = userRecord?.name || 'Admin';

  await db.transaction(async (tx) => {
    for (const adj of adjustments) {
      const item = operative.inventoryCountItems.find(i => i.id === adj.itemId);
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
        await tx.update(product)
          .set({
            location: adj.finalLocation,
            lastCountedAt: new Date().toISOString()
          })
          .where(eq(product.id, item.productId));
      } else {
        await tx.update(product)
          .set({ lastCountedAt: new Date().toISOString() })
          .where(eq(product.id, item.productId));
      }
    }

    await tx.update(inventoryCountOperative)
      .set({
        status: 'APPROVED',
        approvedAt: new Date().toISOString(),
        approvedBy: userId
      })
      .where(eq(inventoryCountOperative.id, operativeId));
  });
}
