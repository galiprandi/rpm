/**
 * API Route: /api/products
 * Métodos: GET, POST
 * Spec: /specs/inventory-sales.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withPermission } from '@/lib/api-middleware';
import { getProducts, createProduct, createStockMovement, type MovementReason } from '@/lib/services/productService';
import { hasPermission } from '@/lib/permissions/check';
import { revalidatePath } from 'next/cache';

// Renderizado on-demand sin revalidate periódico
export const dynamic = 'force-dynamic';

// GET /api/products - Listar productos (cualquier usuario autenticado)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withAuth(async (request: NextRequest, _session) => {
  try {
    const { searchParams } = request.nextUrl;

    // Filtros opcionales
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const lowStock = searchParams.get('lowStock');
    const isActive = searchParams.get('isActive') !== 'false'; // default true

    const result = await getProducts({
      search: search || undefined,
      categoryId: categoryId || undefined,
      lowStock: lowStock === 'true',
      isActive,
    });

    return NextResponse.json({ products: result.products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    );
  }
});

// POST /api/products - Crear producto (requiere can_edit_products)
export const POST = withPermission('can_edit_products', async (request: NextRequest, session) => {
  try {
    const body = await request.json();

    // Field-level permission checks:
    // Strip cost/stock fields the user is not allowed to edit.
    // For POST, stripped fields default to 0 (no existing product to fall back to).
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

    // Validaciones básicas
    if (!body.name || !body.categoryId) {
      return NextResponse.json(
        { error: 'Nombre y categoría son requeridos' },
        { status: 400 }
      );
    }

    // Generar SKU automático si no se proporciona
    const sku = body.sku || `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Cost fields are optional when the user lacks can_edit_costs (default to 0)
    const costPrice = canEditCosts ? body.costPrice : 0;
    const replacementCost = canEditCosts ? body.replacementCost : 0;
    if (canEditCosts) {
      if (replacementCost === undefined || replacementCost === null || isNaN(replacementCost)) {
        return NextResponse.json(
          { error: 'replacementCost es requerido' },
          { status: 400 }
        );
      }

      if (costPrice === undefined || costPrice === null || isNaN(costPrice)) {
        return NextResponse.json(
          { error: 'costPrice es requerido' },
          { status: 400 }
        );
      }
    }

    // Stock fields are optional when the user lacks can_edit_stock (default to 0)
    const stock = canEditStock ? (body.stock || 0) : 0;
    const minStock = canEditStock ? (body.minStock || 0) : 0;
    if (canEditStock && (body.stock < 0 || body.minStock < 0)) {
      return NextResponse.json(
        { error: 'El stock no puede ser negativo' },
        { status: 400 }
      );
    }

    try {
      const product = await createProduct({
        sku,
        name: body.name,
        description: body.description,
        barcode: body.barcode,
        categoryId: body.categoryId,
        costPrice,
        replacementCost,
        stock,
        minStock,
        supplierId: body.supplierId,
        location: body.location,
      });

      // Create stock movement record if initial stock > 0
      if (stock > 0) {
        await createStockMovement({
          productId: product.id,
          userId: session.user.id,
          userName: session.user.name || session.user.email || 'Sistema',
          type: 'IN',
          quantity: stock,
          previousStock: 0,
          newStock: stock,
          reason: 'CARGA_INICIAL' as MovementReason,
          salePrice: undefined,
        });
      }

      // Revalidate cache on-demand
      revalidatePath('/adm/products');
      revalidatePath('/adm/dashboard');

      return NextResponse.json(product, { status: 201 });
    } catch (error: unknown) {
      // Handle unique constraint violations (PostgreSQL code 23505)
      // Drizzle wraps PG errors in error.cause, so check both levels
      const cause = error && typeof error === 'object' && 'cause' in error ? error.cause : null;
      const pgError = cause && typeof cause === 'object' && 'code' in cause
        ? cause as { code?: string; detail?: string }
        : error as { code?: string; detail?: string };

      if (pgError.code === '23505') {
        if (pgError.detail?.includes('sku')) {
          return NextResponse.json(
            { error: 'Ya existe un producto con ese SKU' },
            { status: 409 }
          );
        }
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
});
