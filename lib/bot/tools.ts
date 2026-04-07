import { prisma } from '@/lib/prisma';
import { tool } from 'ai';
import { z } from 'zod';

/**
 * Tool: Check stock of a product
 */
export const checkStockTool = tool({
  description: 'Check the current stock level of a product by SKU or name',
  inputSchema: z.object({
    query: z.string().describe('Product SKU or name to search'),
  }),
  execute: async ({ query }) => {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { sku: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: {
        sku: true,
        name: true,
        stock: true,
        replacementCost: true,
      },
    });

    if (products.length === 0) {
      return { success: false, message: 'No products found' };
    }

    return {
      success: true,
      products: products.map((p) => ({
        sku: p.sku,
        name: p.name,
        stock: p.stock,
        cost: Number(p.replacementCost),
      })),
    };
  },
});

/**
 * Tool: Get daily sales summary
 */
export const getDailySalesTool = tool({
  description: 'Get the total sales for today or a specific date',
  inputSchema: z.object({
    date: z.string().optional().describe('Date in YYYY-MM-DD format (defaults to today)'),
  }),
  execute: async ({ date }) => {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const cashMovements = await prisma.cash_movement.findMany({
      where: {
        type: 'INCOME',
        createdAt: {
          gte: targetDate,
          lt: nextDay,
        },
      },
    });

    const total = cashMovements.reduce((sum, m) => sum + Number(m.amount), 0);

    return {
      success: true,
      date: targetDate.toISOString().split('T')[0],
      totalSales: total,
      transactionCount: cashMovements.length,
    };
  },
});

/**
 * Tool: Search products
 */
export const searchProductsTool = tool({
  description: 'Search for products by name, SKU, or category',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
    limit: z.number().optional().default(10).describe('Maximum results'),
  }),
  execute: async ({ query, limit }) => {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { sku: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      products: products.map((p) => ({
        sku: p.sku,
        name: p.name,
        stock: p.stock,
        cost: Number(p.replacementCost),
        category: p.category?.name || 'Uncategorized',
      })),
    };
  },
});

/**
 * Export all tools
 */
export const botTools = {
  checkStock: checkStockTool,
  getDailySales: getDailySalesTool,
  searchProducts: searchProductsTool,
};
