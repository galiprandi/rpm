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
      // Check if UserRole exists
      const existing = await prisma.userRole.findUnique({
        where: { email: session.user.email },
      });
      
      // Create if not exists
      if (!existing) {
        await prisma.userRole.create({
          data: {
            email: session.user.email,
            role: 'USER',
            name: session.user.name || session.user.email.split('@')[0],
            isActive: true,
            lastLogin: new Date(),
          },
        });
      }
    } catch (err) {
      // Silent fail - don't break the app if sync fails
      console.error('Error syncing UserRole in server component:', err);
    }
  }
  
  // This component renders nothing
  return null;
}
