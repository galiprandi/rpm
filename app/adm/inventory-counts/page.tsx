import { prisma } from '@/lib/prisma';
import { InventoryCountsClient } from '@/components/inventory-count/InventoryCountsClient';

export default async function InventoryCountsPage() {
  const counts = await prisma.inventory_count_operative.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      items: {
        select: {
          reportedAt: true,
        }
      }
    }
  });

  const serializedCounts = counts.map(count => ({
    ...count,
    createdAt: count.createdAt.toISOString(),
    items: count.items.map(item => ({
      reportedAt: item.reportedAt?.toISOString() ?? null,
    })),
  }));

  return <InventoryCountsClient counts={serializedCounts} />;
}
