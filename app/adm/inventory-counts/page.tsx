import { db } from '@/lib/db';
import { inventoryCountOperative } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { InventoryCountsClient } from '@/components/inventory-count/InventoryCountsClient';

export default async function InventoryCountsPage() {
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
