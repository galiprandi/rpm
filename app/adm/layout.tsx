/**
 * Server-side Admin Layout with Authentication
 * 
 * Validates session before rendering admin content
 * Redirects to login if not authenticated
 */

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
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

  // Pass user data to client component
  return (
    <AdminClientLayout user={session.user}>
      {children}
    </AdminClientLayout>
  );
}
