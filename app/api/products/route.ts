/**
 * API Route: /api/products
 * Métodos: GET, POST
 * Spec: /specs/inventory-sales.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { getProducts, createStockMovement } from '@/lib/services/productService';
import { Prisma } from '@/generated/client';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

// GET /api/products - Listar productos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filtros opcionales
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const lowStock = searchParams.get('lowStock');
    const isActive = searchParams.get('isActive') !== 'false'; // default true
    
    const where: Prisma.productWhereInput = { isActive };
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } },
        { barcode: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    
    if (lowStock === 'true') {
      where.stock = { lte: prisma.product.fields.minStock };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Calcular margen para cada producto
    const productsWithMargin = products.map(p => {
      const costPrice = Number(p.costPrice);
      const replacementCost = Number(p.replacementCost);
      return {
        ...p,
        costPrice,
        replacementCost,
        margin: costPrice > 0 
          ? Number(((replacementCost - costPrice) / costPrice * 100).toFixed(2))
          : 0,
        isLowStock: p.stock <= p.minStock,
      };
    });

    return NextResponse.json({ products: productsWithMargin });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    );
  }
}

// POST /api/products - Crear producto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get user session for audit trail
    const session = await getSession();
    
    // Validaciones básicas
    if (!body.name || !body.categoryId) {
      return NextResponse.json(
        { error: 'Nombre y categoría son requeridos' },
        { status: 400 }
      );
    }

    // Generar SKU automático si no se proporciona
    const sku = body.sku || `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    if (body.replacementCost === undefined || body.replacementCost === null || isNaN(body.replacementCost)) {
      return NextResponse.json(
        { error: 'replacementCost es requerido' },
        { status: 400 }
      );
    }

    if (body.costPrice === undefined || body.costPrice === null || isNaN(body.costPrice)) {
      return NextResponse.json(
        { error: 'costPrice es requerido' },
        { status: 400 }
      );
    }

    if (body.stock < 0 || body.minStock < 0) {
      return NextResponse.json(
        { error: 'El stock no puede ser negativo' },
        { status: 400 }
      );
    }

    // Verificar SKU único solo si se proporciona
    if (sku) {
      const existing = await prisma.product.findUnique({
        where: { sku: sku },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Ya existe un producto con ese SKU' },
          { status: 409 }
        );
      }
    }

    try {
      const product = await prisma.product.create({
        data: {
          id: randomUUID(),
          sku: sku,
          name: body.name,
          description: body.description || null,
          costPrice: body.costPrice,
          replacementCost: body.replacementCost,
          stock: body.stock || 0,
          minStock: body.minStock || 0,
          supplierId: body.supplierId || null,
          barcode: body.barcode || null,
          location: body.location || null,
          categoryId: body.categoryId,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      // Create stock movement record if initial stock > 0
      const initialStock = body.stock || 0;
      if (initialStock > 0) {
        await createStockMovement({
          productId: product.id,
          userId: session?.user?.id,
          userName: session?.user?.name || session?.user?.email || 'Sistema',
          type: 'IN',
          quantity: initialStock,
          previousStock: 0,
          newStock: initialStock,
          reason: 'INITIAL_STOCK' as any,
          salePrice: undefined,
        });
      }

      return NextResponse.json(product, { status: 201 });
    } catch (error: any) {
      // Handle Prisma unique constraint errors
      if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
        return NextResponse.json(
          { error: 'Ya existe un producto con ese SKU' },
          { status: 409 }
        );
      }
      
      console.error('Error creating product:', error);
      return NextResponse.json(
        { error: 'Error creando producto' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/products:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
