import { headers } from 'next/headers';
import UsersClient from './UsersClient';

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default async function UsersPage() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/users?includeInactive=true`, {
    cache: 'no-store',
  });
  const data = await res.json();
  const users: User[] = data.users || [];

  return <UsersClient initialUsers={users} />;
}
