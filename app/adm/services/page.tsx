import { headers } from 'next/headers';
import ServicesClient from './ServicesClient';

interface Service {
  id: string;
  name: string;
  description: string | null;
  baseCost: number;
  timeMinutes: number;
  vehicleFactor: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default async function ServicesPage() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/services`, {
    cache: 'no-store',
  });
  const data = await res.json();
  const services: Service[] = data.services || [];

  return <ServicesClient initialServices={services} />;
}
