import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import CreditNotesClient from './CreditNotesClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CreditNotesPage() {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
    throw new Error('Acceso denegado');
  }

  const creditNotes = await prisma.credit_note.findMany({
    take: 50,
    include: {
      customer: {
        select: { id: true, name: true, phone: true },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const decimalToNumber = (decimal: unknown): number => {
    if (decimal === null || decimal === undefined) return 0;
    if (typeof decimal === 'number') return decimal;
    if (typeof decimal === 'object' && 'toNumber' in decimal && typeof (decimal as { toNumber: () => number }).toNumber === 'function') {
      return (decimal as { toNumber: () => number }).toNumber();
    }
    return 0;
  };

  const creditNotesFormatted = creditNotes.map((cn: typeof creditNotes[number]) => ({
    ...cn,
    total: decimalToNumber(cn.total),
    itemCount: cn._count.items,
    createdAt: cn.createdAt.toISOString(),
  }));

  return <CreditNotesClient initialCreditNotes={creditNotesFormatted} />;
}
