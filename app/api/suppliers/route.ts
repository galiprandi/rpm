/**
 * API Route: /api/suppliers
 * Métodos: GET, POST
 * Spec: /specs/suppliers.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from '@/lib/utils';

// GET /api/suppliers - Listar proveedores
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const suppliers = await prisma.supplier.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const suppliersWithCount = suppliers.map(s => ({
      ...s,
      productCount: s._count.products,
      _count: undefined,
    }));

    return NextResponse.json({ suppliers: suppliersWithCount });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Error al obtener proveedores' },
      { status: 500 }
    );
  }
}

// POST /api/suppliers - Crear proveedor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validaciones
    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre del proveedor es requerido' },
        { status: 400 }
      );
    }

    // Verificar nombre único
    const existing = await prisma.supplier.findUnique({
      where: { name: body.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un proveedor con ese nombre' },
        { status: 409 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        id: nanoid(),
        name: body.name,
        contactName: body.contactName || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        notes: body.notes || null,
        isActive: true,
      },
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Error al crear proveedor' },
      { status: 500 }
    );
  }
}
