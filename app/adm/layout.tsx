/**
 * Server-side Admin Layout with Authentication
 * 
 * Validates session before rendering admin content
 * Redirects to login if not authenticated
 */

import { redirect } from 'next/navigation';
import { getSession, hasRole } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { AdminClientLayout } from '@/components/adm/layout/AdminClientLayout';
import { prisma } from '@/lib/prisma';
import { getUserRole as determineUserRole } from '@/lib/auth/roles';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validate session server-side
  const session = await getSession();

  if (!session?.user) {
    // Redirect to login if not authenticated
    redirect('/login?callbackUrl=/adm');
  }

  // Check if user has at least STAFF role
  const isAuthorized = await hasRole(UserRole.STAFF);
  if (!isAuthorized) {
    // Redirect to home if not authorized
    redirect('/');
  }

  // Sync UserRole record for admin management
  // This ensures the user appears in the users table
  if (session.user.email) {
    const existingUserRole = await prisma.userRole.findUnique({
      where: { email: session.user.email },
    });

    if (!existingUserRole) {
      // Determine role from domain
      const role = await determineUserRole(session.user.email);
      const roleToStore = role === UserRole.ADMIN ? 'ADMIN' : 
                         role === UserRole.STAFF ? 'SELLER' : 'USER';
      
      await prisma.userRole.create({
        data: {
          email: session.user.email,
          role: roleToStore,
          name: session.user.name || session.user.email.split('@')[0],
          isActive: true,
        },
      });
    }
  }

  // Pass user data to client component
  return (
    <AdminClientLayout user={session.user}>
      {children}
    </AdminClientLayout>
  );
}
