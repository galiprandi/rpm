import { headers } from 'next/headers';
import CustomersClient from './CustomersClient';

interface Customer {
  id: string;
  name: string;
  phone: string;
  phoneAlt?: string;
  email?: string;
  billingData?: {
    cuit: string;
    invoiceType: string;
  };
  vehicles: Array<{
    id: string;
    identifier: string;
    category: string;
  }>;
  _count: {
    workOrders: number;
  };
}

export default async function CustomersPage() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const params = new URLSearchParams();
  params.set('limit', '50');

  const res = await fetch(`${baseUrl}/api/customers?${params}`, {
    cache: 'no-store',
  });
  const data = await res.json();
  const customers: Customer[] = data.customers || [];

  return <CustomersClient initialCustomers={customers} />;
}
