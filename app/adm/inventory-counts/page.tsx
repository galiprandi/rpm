import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { inventoryCountOperative } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { InventoryCountsClient } from '@/components/inventory-count/InventoryCountsClient';
import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';

export default async function InventoryCountsPage() {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

  if (userRole !== UserRole.ADMIN) {
    redirect('/adm');
  }

  const counts = await db.query.inventoryCountOperative.findMany({
    orderBy: desc(inventoryCountOperative.createdAt),
    limit: 10,
    with: {
      inventoryCountItems: true,
    },
  });

  const serializedCounts = counts.map(count => ({
    ...count,
    createdAt: new Date(count.createdAt).toISOString(),
    items: (count.inventoryCountItems || []).map(item => ({
      reportedAt: item.reportedAt ? new Date(item.reportedAt).toISOString() : null,
    })),
  }));

  return <InventoryCountsClient counts={serializedCounts as any} />;
}
