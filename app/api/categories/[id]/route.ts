/**
 * API Route: /api/categories/[id]
 * Métodos: GET, PUT, DELETE
 * Spec: /specs/inventory-sales.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { category, product } from '@/db/schema';
import { eq, count } from 'drizzle-orm';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/categories/[id] - Obtener categoría por ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const cat = await db.query.category.findFirst({
      where: eq(category.id, id),
    });

    if (!cat) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    // Count products in this category
    const productCountResult = await db
      .select({ value: count() })
      .from(product)
      .where(eq(product.categoryId, id));
    const productCount = productCountResult[0]?.value || 0;

    return NextResponse.json({
      category: {
        ...cat,
        productCount,
      },
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Error al obtener categoría' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Actualizar categoría
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar que la categoría existe
    const existing = await db.query.category.findFirst({
      where: eq(category.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    // Validar nombre único si cambia
    if (body.name && body.name !== existing.name) {
      const nameExists = await db.query.category.findFirst({
        where: eq(category.name, body.name),
      });
      if (nameExists) {
        return NextResponse.json(
          { error: 'Ya existe una categoría con ese nombre' },
          { status: 409 }
        );
      }
    }

    const [updated] = await db
      .update(category)
      .set({
        name: body.name,
        description: body.description,
        defaultMarginPercent: body.defaultMarginPercent,
        color: body.color,
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      })
      .where(eq(category.id, id))
      .returning();

    return NextResponse.json({ category: updated });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Error al actualizar categoría' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Desactivar categoría (soft delete)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Verificar que la categoría existe
    const existing = await db.query.category.findFirst({
      where: eq(category.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que no tenga productos activos
    const productCountResult = await db
      .select({ value: count() })
      .from(product)
      .where(eq(product.categoryId, id));
    const productCount = productCountResult[0]?.value || 0;

    if (productCount > 0) {
      return NextResponse.json(
        { error: 'No se puede desactivar una categoría con productos' },
        { status: 400 }
      );
    }

    // Soft delete: desactivar en lugar de borrar
    const [updated] = await db
      .update(category)
      .set({ isActive: false })
      .where(eq(category.id, id))
      .returning();

    return NextResponse.json({
      message: 'Categoría desactivada exitosamente',
      category: updated,
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Error al desactivar categoría' },
      { status: 500 }
    );
  }
}
