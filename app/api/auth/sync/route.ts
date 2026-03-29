/**
 * API Route: /api/auth/sync
 * Sincroniza el usuario autenticado con UserRole
 * Llamado desde el cliente para cualquier usuario logueado
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const email = session.user.email;
    const name = session.user.name || email.split('@')[0];
    
    // Check if UserRole already exists
    const existing = await prisma.userRole.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ 
        message: 'UserRole ya existe',
        created: false,
      });
    }

    // Create UserRole with USER role
    await prisma.userRole.create({
      data: {
        email,
        role: 'USER',
        name,
        isActive: true,
      },
    });

    return NextResponse.json({ 
      message: 'UserRole creado',
      created: true,
    });
    
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar' },
      { status: 500 }
    );
  }
}
