/**
 * Server Component: UserSyncServer
 * 
 * Sincroniza automáticamente el usuario autenticado con UserRole
 * Se ejecuta en cada request del root layout (una sola vez)
 * Actualiza: lastLogin, name, image
 * No renderiza nada visual
 */
import { getSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { userRole } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function UserSyncServer() {
  const session = await getSession();
  
  // Only sync if user is authenticated
  if (session?.user?.email) {
    try {
      // Upsert: create if not exists, always update fields
      const existing = await db.query.userRole.findFirst({
        where: eq(userRole.email, session.user.email),
      });

      if (existing) {
        await db
          .update(userRole)
          .set({
            // Always update on every request to keep data fresh
            lastLogin: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Update name if provided by Better Auth
            name: session.user.name || existing.name,
            // Update image if provided by Better Auth
            image: session.user.image || existing.image,
          })
          .where(eq(userRole.email, session.user.email));
      } else {
        await db.insert(userRole).values({
          id: `role-${session.user.email}`,
          email: session.user.email,
          role: 'USER',
          name: session.user.name || session.user.email.split('@')[0],
          image: session.user.image || null,
          isActive: true,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
