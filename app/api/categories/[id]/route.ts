/**
 * API Route: /api/categories/[id]
 * Métodos: GET, PUT, DELETE
 * Spec: /specs/inventory-sales.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/categories/[id] - Obtener categoría por ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      category: {
        ...category,
        productCount: category._count.products,
        _count: undefined,
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
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    // Validar nombre único si cambia
    if (body.name && body.name !== existing.name) {
      const nameExists = await prisma.category.findUnique({
        where: { name: body.name },
      });
      if (nameExists) {
        return NextResponse.json(
          { error: 'Ya existe una categoría con ese nombre' },
          { status: 409 }
        );
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        defaultMarginPercent: body.defaultMarginPercent,
        color: body.color,
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ category });
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
    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que no tenga productos activos
    if (existing._count.products > 0) {
      return NextResponse.json(
        { error: 'No se puede desactivar una categoría con productos' },
        { status: 400 }
      );
    }

    // Soft delete: desactivar en lugar de borrar
    const category = await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: 'Categoría desactivada exitosamente',
      category,
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Error al desactivar categoría' },
      { status: 500 }
    );
  }
}
