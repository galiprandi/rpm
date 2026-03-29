/**
 * Server-side Admin Layout with Authentication
 * 
 * Validates session before rendering admin content
 * Redirects to login if not authenticated
 */

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { hasRole } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { AdminClientLayout } from '@/components/adm/layout/AdminClientLayout';

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

  // Pass user data to client component
  return (
    <AdminClientLayout user={session.user}>
      {children}
    </AdminClientLayout>
  );
}
