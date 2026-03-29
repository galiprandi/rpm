/**
 * API Route: /api/categories
 * Métodos: GET, POST
 * Spec: /specs/inventory-sales.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from '@/lib/utils';

// GET /api/categories - Listar categorías
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const categories = await prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const categoriesWithCount = categories.map(c => ({
      ...c,
      productCount: c._count.products,
      _count: undefined,
    }));

    return NextResponse.json({ categories: categoriesWithCount });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Crear categoría
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validaciones
    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre de la categoría es requerido' },
        { status: 400 }
      );
    }

    // Verificar nombre único
    const existing = await prisma.category.findUnique({
      where: { name: body.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre' },
        { status: 409 }
      );
    }

    // Obtener el máximo sortOrder para poner la nueva al final
    const lastCategory = await prisma.category.findFirst({
      orderBy: { sortOrder: 'desc' },
    });

    const category = await prisma.category.create({
      data: {
        id: nanoid(),
        name: body.name,
        description: body.description || null,
        defaultMarginPercent: body.defaultMarginPercent || 40,
        color: body.color || null,
        sortOrder: lastCategory ? lastCategory.sortOrder + 1 : 1,
        isActive: true,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}
