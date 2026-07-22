/**
 * API Route: /api/products/[id]
 * Métodos: GET, PUT, DELETE
 * Spec: /specs/inventory-sales.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAdminDynamic } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { product } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { adjustStock, updateProduct, deactivateProduct, getProductById } from '@/lib/services/productService';
import { revalidatePath } from 'next/cache';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/products/[id] - Obtener producto por ID (requiere ADMIN)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withAdminDynamic(async (request: NextRequest, { params }: Params, _session) => {
  try {
    const { id } = await params;

    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    );
  }
});

// PUT /api/products/[id] - Actualizar producto (requiere ADMIN)
export const PUT = withAdminDynamic(async (request: NextRequest, { params }: Params, session) => {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar que el producto existe
    const existing = await db.query.product.findFirst({
      where: eq(product.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Validaciones
    if (body.sku && body.sku !== existing.sku) {
      const skuExists = await db.query.product.findFirst({
        where: eq(product.sku, body.sku),
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

    if (body.replacementCost !== undefined && body.replacementCost < 0) {
      return NextResponse.json(
        { error: 'El costo de reposición no puede ser negativo' },
        { status: 400 }
      );
    }

    // Check if stock is being modified
    const stockChanged = body.stock !== undefined && Number(body.stock) !== existing.stock;

    let updatedProduct;
    if (stockChanged) {
      // Use adjustStock for stock changes (includes audit trail)
      updatedProduct = await adjustStock(
        id,
        'set',
        body.stock,
        session.user.id,
        session.user.name || session.user.email || 'Sistema',
        'AJUSTE_INVENTARIO',
        `Ajuste manual de stock: ${existing.stock} → ${body.stock}`
      );
      
      // Update other fields separately if needed
      const otherFields = { ...body };
      delete otherFields.stock;
      if (Object.keys(otherFields).length > 0) {
        updatedProduct = await updateProduct(id, otherFields);
      }
    } else {
      // No stock change - just update other fields
      updatedProduct = await updateProduct(id, body);
    }

    // Revalidate cache on-demand
    revalidatePath('/adm/products');
    revalidatePath('/adm/dashboard');

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    );
  }
});

// DELETE /api/products/[id] - Desactivar producto (soft delete) (requiere ADMIN)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const DELETE = withAdminDynamic(async (request: NextRequest, { params }: Params, _session) => {
  try {
    const { id } = await params;

    // Verificar que el producto existe
    const existing = await db.query.product.findFirst({
      where: eq(product.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete: desactivar en lugar de borrar
    await deactivateProduct(id);

    // Revalidate cache on-demand
    revalidatePath('/adm/products');
    revalidatePath('/adm/dashboard');

    return NextResponse.json({
      message: 'Producto desactivado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Error al desactivar producto' },
      { status: 500 }
    );
  }
});
