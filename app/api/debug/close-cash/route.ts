import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/debug/close-cash - Debug endpoint to force close cash register
export async function POST() {
  try {
    // Find the latest OPENING movement
    const lastOpening = await prisma.cash_movement.findFirst({
      where: { type: 'OPENING' },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastOpening) {
      return NextResponse.json({ error: 'No opening movement found' }, { status: 404 });
    }

    // Create a CLOSING movement
    const closing = await prisma.cash_movement.create({
      data: {
        type: 'CLOSING',
        amount: lastOpening.amount,
        method: 'CASH',
        referenceType: 'manual',
        reason: 'Cierre forzado por debug',
        createdBy: 'debug-system',
      },
    });

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
}
