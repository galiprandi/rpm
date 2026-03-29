/**
 * API Route: /api/users
 * Métodos: GET, POST
 * Spec: /specs/users.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import {
  getUsers,
  createUser,
  getUserByEmail,
  CreateUserInput,
} from '@/lib/services/userService';

// GET /api/users - Listar usuarios
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // Only ADMIN can list users
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const result = await getUsers(includeInactive);

    return NextResponse.json({ users: result.users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

// POST /api/users - Crear usuario
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    // Only ADMIN can create users
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validations
    if (!body.email || !body.name || !body.role) {
      return NextResponse.json(
        { error: 'Email, nombre y rol son requeridos' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await getUserByEmail(body.email);
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email' },
        { status: 409 }
      );
    }

    const user = await createUser({
      email: body.email,
      name: body.name,
      role: body.role as CreateUserInput['role'],
      notes: body.notes,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    const message = error instanceof Error ? error.message : 'Error al crear usuario';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
