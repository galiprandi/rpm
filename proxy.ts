import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function proxy(request: NextRequest) {
  // Skip sync for static files and API routes that don't need it
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Sync role with ADMIN_EMAILS if user is authenticated
    if (session?.user?.email) {
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
      
      if (adminEmails.includes(session.user.email.toLowerCase())) {
        const currentRole = (session.user as { role?: string }).role;
        
        // Update role in database if not already ADMIN
        if (currentRole !== 'ADMIN') {
          await db
            .update(user)
            .set({ role: 'ADMIN' })
            .where(eq(user.id, session.user.id));
        }
      }
    }
  } catch (error) {
    // Don't block the request if sync fails
    console.error('Error syncing role in proxy:', error);
  }

  return NextResponse.next();
}
