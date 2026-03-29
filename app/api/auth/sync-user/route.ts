/**
 * API Route: /api/auth/sync-user
 * Sincroniza el usuario autenticado con la tabla UserRole
 * Se debe llamar después del login exitoso
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { getUserRole, UserRole } from '@/lib/auth/roles';

export async function POST() {
  try {
    const session = await getSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const email = session.user.email;
    const name = session.user.name || email.split('@')[0];
    
    // Check if UserRole already exists
    const existingUserRole = await prisma.userRole.findUnique({
      where: { email },
    });

    if (existingUserRole) {
      // Update name if changed
      if (existingUserRole.name !== name) {
        await prisma.userRole.update({
          where: { email },
          data: { name },
        });
      }
      
      return NextResponse.json({ 
        message: 'UserRole ya existe',
        userRole: existingUserRole,
        created: false,
      });
    }

    // Determine role based on email domain
    const role = await getUserRole(email);
    
    // Map role to stored value
    const roleToStore = role === UserRole.ADMIN ? 'ADMIN' : 
                       role === UserRole.STAFF ? 'SELLER' : 'USER';
    
    // Create UserRole record
    const userRole = await prisma.userRole.create({
      data: {
        email,
        role: roleToStore,
        name,
        isActive: true,
      },
    });

    return NextResponse.json({ 
      message: 'UserRole creado exitosamente',
      userRole,
      created: true,
    });
    
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar usuario' },
      { status: 500 }
    );
  }
}
