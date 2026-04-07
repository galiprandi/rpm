import { headers } from 'next/headers';
import PaymentMethodsClient from './PaymentMethodsClient';

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: {
    payments: number;
  };
}

export default async function PaymentMethodsPage() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/payment-methods`, {
    cache: 'no-store',
  });
  const data = await res.json();
  const paymentMethods: PaymentMethod[] = data.paymentMethods || [];

  return <PaymentMethodsClient initialPaymentMethods={paymentMethods} />;
}
