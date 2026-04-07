import { headers } from 'next/headers';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/settings`, {
    cache: 'no-store',
  });
  const data = await res.json();
  const initialMinimumMargin = data.minimumMarginPercentage || 15.0;

  return <SettingsClient initialMinimumMargin={initialMinimumMargin} />;
}
