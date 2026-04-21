/**
 * API Route: /api/products
 * Métodos: GET, POST
 * Spec: /specs/inventory-sales.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { getProducts, createProduct, createStockMovement, type MovementReason } from '@/lib/services/productService';
import { revalidatePath } from 'next/cache';

// Renderizado on-demand sin revalidate periódico
export const dynamic = 'force-dynamic';

// GET /api/products - Listar productos (requiere ADMIN)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withAdmin(async (request: NextRequest, _session) => {
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

// POST /api/products - Crear producto (requiere ADMIN)
export const POST = withAdmin(async (request: NextRequest, session) => {
  try {
    const body = await request.json();

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

    try {
      const product = await createProduct({
        sku,
        name: body.name,
        description: body.description,
        barcode: body.barcode,
        categoryId: body.categoryId,
        costPrice: body.costPrice,
        replacementCost: body.replacementCost,
        stock: body.stock || 0,
        minStock: body.minStock || 0,
        supplierId: body.supplierId,
        location: body.location,
      });

      // Create stock movement record if initial stock > 0
      const initialStock = body.stock || 0;
      if (initialStock > 0) {
        await createStockMovement({
          productId: product.id,
          userId: session.user.id,
          userName: session.user.name || session.user.email || 'Sistema',
          type: 'IN',
          quantity: initialStock,
          previousStock: 0,
          newStock: initialStock,
          reason: 'CARGA_INICIAL' as MovementReason,
          salePrice: undefined,
        });
      }

      // Revalidate cache on-demand
      revalidatePath('/adm/products');
      revalidatePath('/adm/dashboard');

      return NextResponse.json(product, { status: 201 });
    } catch (error: unknown) {
      // Handle Prisma unique constraint errors
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        const prismaError = error as { meta?: { target?: string[] } };
        if (prismaError.meta?.target?.includes('sku')) {
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
