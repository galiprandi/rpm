/**
 * API Route: /api/products/[id]
 * Métodos: GET, PUT, DELETE
 * Spec: /specs/inventory-sales.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAdminDynamic, withPermissionDynamic } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { product } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { adjustStock, updateProduct, deactivateProduct, getProductById } from '@/lib/services/productService';
import { hasPermission } from '@/lib/permissions/check';
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

// PUT /api/products/[id] - Actualizar producto (requiere can_edit_products)
export const PUT = withPermissionDynamic('can_edit_products', async (request: NextRequest, { params }: Params, session) => {
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

    // Field-level permission checks:
    // Strip cost/stock fields the user is not allowed to edit.
    // For PUT, keep the existing product's values so they are preserved.
    const canEditCosts = hasPermission(session, 'can_edit_costs');
    const canEditStock = hasPermission(session, 'can_edit_stock');

    if (!canEditCosts) {
      delete body.costPrice;
      delete body.replacementCost;
    }
    if (!canEditStock) {
      delete body.stock;
      delete body.minStock;
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

    // Check if stock is being modified (only possible when can_edit_stock)
    const stockChanged = canEditStock && body.stock !== undefined && Number(body.stock) !== existing.stock;

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

// DELETE /api/products/[id] - Desactivar producto (soft delete) (requiere can_edit_products)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const DELETE = withPermissionDynamic('can_edit_products', async (request: NextRequest, { params }: Params, _session) => {
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
