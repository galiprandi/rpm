/**
 * API Route: /api/users/[id]
 * Métodos: GET, PUT, DELETE, PATCH
 * Spec: /specs/users.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { withPermissionDynamic } from '@/lib/api-middleware';
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

// GET /api/users/[id] - Obtener usuario específico (requiere can_manage_users)
export const GET = withPermissionDynamic('can_manage_users', async (_request: NextRequest, { params }: RouteParams, _session) => {
  try {
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
});

// PUT /api/users/[id] - Actualizar usuario (requiere can_manage_users)
export const PUT = withPermissionDynamic('can_manage_users', async (request: NextRequest, { params }: RouteParams, session) => {
  try {
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

    const user = await updateUser(id, updateData, session.user.email || session.user.id);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    const message = error instanceof Error ? error.message : 'Error al actualizar usuario';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
});

// PATCH /api/users/[id] - Toggle active status (requiere can_manage_users)
export const PATCH = withPermissionDynamic('can_manage_users', async (_request: NextRequest, { params }: RouteParams, session) => {
  try {
    const { id } = await params;
    const user = await toggleUserActive(id, session.user.email || session.user.id);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error toggling user status:', error);
    const message = error instanceof Error ? error.message : 'Error al cambiar estado del usuario';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
});

// DELETE /api/users/[id] - Eliminar usuario (requiere can_manage_users)
export const DELETE = withPermissionDynamic('can_manage_users', async (_request: NextRequest, { params }: RouteParams, session) => {
  try {
    const { id } = await params;
    await deleteUser(id, session.user.email || session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    const message = error instanceof Error ? error.message : 'Error al eliminar usuario';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
});
