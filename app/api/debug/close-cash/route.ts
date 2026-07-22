import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { cashMovement } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// POST /api/debug/close-cash - Debug endpoint to force close cash register
export const POST = withAdmin(async () => {
  try {
    // Find the latest OPENING movement
    const lastOpening = await db.query.cashMovement.findFirst({
      where: eq(cashMovement.type, 'OPENING'),
      orderBy: desc(cashMovement.createdAt),
    });

    if (!lastOpening) {
      return NextResponse.json({ error: 'No opening movement found' }, { status: 404 });
    }

    // Create a CLOSING movement
    const [closing] = await db
      .insert(cashMovement)
      .values({
        type: 'CLOSING',
        amount: lastOpening.amount,
        method: 'CASH',
        referenceType: 'manual',
        reason: 'Cierre forzado por debug',
        createdBy: 'debug-system',
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Cash register force closed',
      opening: lastOpening.id,
      closing: closing.id,
    });
  } catch (error) {
    console.error('Error force closing cash register:', error);
    return NextResponse.json(
      { error: 'Failed to force close cash register' },
      { status: 500 }
    );
  }
});
