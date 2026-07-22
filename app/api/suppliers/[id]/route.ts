/**
 * API Route: /api/suppliers/[id]
 * Métodos: PUT, DELETE
 * Spec: /specs/suppliers.md
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supplier } from "@/db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

// PUT /api/suppliers/[id] - Actualizar proveedor
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar que el proveedor existe
    const existing = await db.query.supplier.findFirst({
      where: eq(supplier.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 },
      );
    }

    // Si cambia el nombre, verificar que no exista otro con ese nombre
    if (body.name && body.name !== existing.name) {
      const nameExists = await db.query.supplier.findFirst({
        where: eq(supplier.name, body.name),
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "Ya existe un proveedor con ese nombre" },
          { status: 409 },
        );
      }
    }

    const [updated] = await db.update(supplier).set({
      name: body.name,
      contactName: body.contactName,
      phone: body.phone,
      email: body.email,
      address: body.address,
      notes: body.notes,
      isActive: body.isActive,
    }).where(eq(supplier.id, id)).returning();

    return NextResponse.json({ supplier: updated });
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { error: "Error al actualizar proveedor" },
      { status: 500 },
    );
  }
}

// DELETE /api/suppliers/[id] - Desactivar proveedor (soft delete)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Verificar que el proveedor existe y contar productos asociados
    const existing = await db.query.supplier.findFirst({
      where: eq(supplier.id, id),
      with: {
        products: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 },
      );
    }

    // No permitir eliminar si tiene productos asociados
    if (existing.products.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un proveedor con productos asociados" },
        { status: 409 },
      );
    }

    // Soft delete: cambiar isActive a false
    const [updated] = await db.update(supplier).set({ isActive: false }).where(eq(supplier.id, id)).returning();

    return NextResponse.json({ supplier: updated });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { error: "Error al eliminar proveedor" },
      { status: 500 },
    );
  }
}
