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

  // Sync UserRole record for ALL authenticated users
  // This ensures every user appears in the users table
  if (session.user.email) {
    const existingUserRole = await prisma.userRole.findUnique({
      where: { email: session.user.email },
    });

    if (!existingUserRole) {
      // Create with USER role by default
      await prisma.userRole.create({
        data: {
          email: session.user.email,
          role: 'USER',
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
