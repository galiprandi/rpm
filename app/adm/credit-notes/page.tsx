import { db } from '@/lib/db';
import { creditNote } from '@/db/schema';
import { desc } from 'drizzle-orm';
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

  const creditNotes = await db.query.creditNote.findMany({
    limit: 50,
    with: {
      customer: true,
      creditNoteItems: true,
    },
    orderBy: desc(creditNote.createdAt),
  });

  const creditNotesFormatted = creditNotes.map((cn) => ({
    ...cn,
    total: Number(cn.total),
    itemCount: cn.creditNoteItems.length,
    createdAt: new Date(cn.createdAt).toISOString(),
  }));

  return <CreditNotesClient initialCreditNotes={creditNotesFormatted} />;
}
