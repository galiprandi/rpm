/**
 * API Route: /api/suppliers/[id]
 * Métodos: PUT, DELETE
 * Spec: /specs/suppliers.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

// PUT /api/suppliers/[id] - Actualizar proveedor
export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar que el proveedor existe
    const existing = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Si cambia el nombre, verificar que no exista otro con ese nombre
    if (body.name && body.name !== existing.name) {
      const nameExists = await prisma.supplier.findUnique({
        where: { name: body.name },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: 'Ya existe un proveedor con ese nombre' },
          { status: 409 }
        );
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: body.name,
        contactName: body.contactName,
        phone: body.phone,
        email: body.email,
        address: body.address,
        notes: body.notes,
      },
    });

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Error al actualizar proveedor' },
      { status: 500 }
    );
  }
}

// DELETE /api/suppliers/[id] - Desactivar proveedor (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    // Verificar que el proveedor existe
    const existing = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { product: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // No permitir eliminar si tiene productos asociados
    if (existing._count.product > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un proveedor con productos asociados' },
        { status: 409 }
      );
    }

    // Soft delete: cambiar isActive a false
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Error al eliminar proveedor' },
      { status: 500 }
    );
  }
}
