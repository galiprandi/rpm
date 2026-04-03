/**
 * Server-side Admin Layout with Authentication - DEBUG VERSION
 * 
 * Versión temporal con logs para diagnosticar problema de cookie
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSession, hasRole } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { AdminClientLayout } from '@/components/adm/layout/AdminClientLayout';

const DEBUG_COOKIE_NAME = 'rpm_debug_auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // DEBUG: Log de todas las cookies disponibles
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  console.log('[DEBUG AdminLayout] ============================');
  console.log('[DEBUG AdminLayout] Total cookies:', allCookies.length);
  console.log('[DEBUG AdminLayout] Cookie names:', allCookies.map(c => c.name).join(', '));
  
  const debugCookie = cookieStore.get(DEBUG_COOKIE_NAME);
  console.log('[DEBUG AdminLayout] Debug cookie found:', !!debugCookie);
  
  if (debugCookie) {
    try {
      const session = JSON.parse(debugCookie.value);
      console.log('[DEBUG AdminLayout] Debug session user:', session.user?.name);
      console.log('[DEBUG AdminLayout] Debug session role:', session.user?.role);
    } catch (e) {
      console.log('[DEBUG AdminLayout] Error parsing debug cookie:', e);
    }
  }
  
  // Validate session server-side
  const session = await getSession();
  
  console.log('[DEBUG AdminLayout] Session from getSession():', session ? 'EXISTS' : 'NULL');
  if (session?.user) {
    console.log('[DEBUG AdminLayout] Session user:', session.user.name);
    console.log('[DEBUG AdminLayout] Session role:', (session.user as { role?: string }).role);
  }
  console.log('[DEBUG AdminLayout] ============================');

  if (!session?.user) {
    console.log('[DEBUG AdminLayout] ❌ No session, redirecting to login');
    redirect('/login?callbackUrl=/adm');
  }

  // Check if user has at least STAFF role
  const isAuthorized = await hasRole(UserRole.STAFF);
  console.log('[DEBUG AdminLayout] isAuthorized:', isAuthorized);
  
  if (!isAuthorized) {
    console.log('[DEBUG AdminLayout] ❌ Not authorized, redirecting to home');
    redirect('/');
  }

  console.log('[DEBUG AdminLayout] ✅ Authorized, rendering admin layout');

  // Pass user data to client component
  return (
    <AdminClientLayout user={session.user}>
      {children}
    </AdminClientLayout>
  );
}
