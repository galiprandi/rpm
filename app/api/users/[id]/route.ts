/**
 * API Route: /api/users/[id]
 * Métodos: GET, PUT, DELETE, PATCH
 * Spec: /specs/users.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import {
  getUserById,
  updateUser,
  deleteUser,
  toggleUserActive,
  UpdateUserInput,
} from '@/lib/services/userService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id] - Obtener usuario específico
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    // Only ADMIN can get user details
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Actualizar usuario
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    // Only ADMIN can update users
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if user exists
    const existing = await getUserById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const updateData: UpdateUserInput = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const user = await updateUser(id, updateData, session.user.email);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    const message = error instanceof Error ? error.message : 'Error al actualizar usuario';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Toggle active status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    // Only ADMIN can toggle user status
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const user = await toggleUserActive(id, session.user.email);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error toggling user status:', error);
    const message = error instanceof Error ? error.message : 'Error al cambiar estado del usuario';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Eliminar usuario
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    // Only ADMIN can delete users
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await deleteUser(id, session.user.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    const message = error instanceof Error ? error.message : 'Error al eliminar usuario';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
