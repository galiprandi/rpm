/**
 * Server Component: UserSyncServer
 * 
 * Sincroniza automáticamente el usuario autenticado con UserRole
 * Se ejecuta en cada request del root layout (una sola vez)
 * No renderiza nada visual
 */
import { getSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function UserSyncServer() {
  const session = await getSession();
  
  // Only sync if user is authenticated
  if (session?.user?.email) {
    try {
      // Upsert: create if not exists, always update lastLogin
      await prisma.userRole.upsert({
        where: { email: session.user.email },
        create: {
          email: session.user.email,
          role: 'USER',
          name: session.user.name || session.user.email.split('@')[0],
          isActive: true,
          lastLogin: new Date(),
        },
        update: {
          // Always update lastLogin on every request
          lastLogin: new Date(),
          // Update name if changed
          name: session.user.name || undefined,
        },
      });
    } catch (err) {
      // Silent fail - don't break the app if sync fails
      console.error('Error syncing UserRole in server component:', err);
    }
  }
  
  // This component renders nothing
  return null;
}
