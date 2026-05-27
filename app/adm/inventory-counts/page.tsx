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

  return <InventoryCountsClient counts={counts} />;
}
