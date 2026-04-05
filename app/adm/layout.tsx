/**
 * Server-side Admin Layout with Authentication - DEBUG VERSION
 * 
 * Versión temporal con logs para diagnosticar problema de cookie
 */

import { redirect } from 'next/navigation';
import { getSession, hasRole } from '@/lib/auth-server';
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
    redirect('/login?callbackUrl=/adm');
  }

  // Check if user has at least STAFF role
  const isAuthorized = await hasRole(UserRole.STAFF);
  
  if (!isAuthorized) {
    redirect('/');
  }

  // Pass user data to client component
  return (
    <AdminClientLayout user={session.user}>
      {children}
    </AdminClientLayout>
  );
}
