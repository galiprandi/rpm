/**
 * API Route: /api/products/[id]
 * Métodos: GET, PUT, DELETE
 * Spec: /specs/inventory-sales.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/products/[id] - Obtener producto por ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const costPrice = Number(product.costPrice);
    const salePrice = Number(product.salePrice);

    return NextResponse.json({
      product: {
        ...product,
        costPrice,
        salePrice,
        margin: costPrice > 0
          ? Number(((salePrice - costPrice) / costPrice * 100).toFixed(2))
          : 0,
        isLowStock: product.stock <= product.minStock,
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Actualizar producto
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar que el producto existe
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Validaciones
    if (body.sku && body.sku !== existing.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: body.sku },
      });
      if (skuExists) {
        return NextResponse.json(
          { error: 'Ya existe un producto con ese SKU' },
          { status: 409 }
        );
      }
    }

    if (body.costPrice !== undefined && body.costPrice < 0) {
      return NextResponse.json(
        { error: 'El precio de costo no puede ser negativo' },
        { status: 400 }
      );
    }

    if (body.salePrice !== undefined && body.salePrice < 0) {
      return NextResponse.json(
        { error: 'El precio de venta no puede ser negativo' },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        sku: body.sku,
        name: body.name,
        description: body.description,
        costPrice: body.costPrice,
        salePrice: body.salePrice,
        stock: body.stock,
        minStock: body.minStock,
        supplier: body.supplier,
        barcode: body.barcode,
        location: body.location,
        categoryId: body.categoryId,
        isActive: body.isActive,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Desactivar producto (soft delete)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Verificar que el producto existe
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete: desactivar en lugar de borrar
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ 
      message: 'Producto desactivado exitosamente',
      product 
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Error al desactivar producto' },
      { status: 500 }
    );
  }
}
