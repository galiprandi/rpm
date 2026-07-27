import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';
import { getUsers } from '@/lib/services/userService';
import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function UsersPage() {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

  if (userRole !== UserRole.ADMIN) {
    redirect('/adm');
  }

  const data = await getUsers(true);
  const users = data.users;

  return <UsersClient initialUsers={users} />;
}
