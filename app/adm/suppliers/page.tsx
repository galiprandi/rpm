import { headers } from 'next/headers';
import SuppliersClient from './SuppliersClient';

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  productCount: number;
}

export default async function SuppliersPage() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/suppliers?includeInactive=true`, {
    cache: 'no-store',
  });
  const data = await res.json();
  const suppliers: Supplier[] = data.suppliers || [];

  return <SuppliersClient initialSuppliers={suppliers} />;
}
