import { db } from '../lib/db';
import { cashMovement } from '../db/schema';
import { eq, gte, desc, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function closeOrphanedCashRegisters() {
  console.log('Buscando cajas abiertas sin cierre...');

  // Busca todos los OPENING sin CLOSING posterior
  const orphanedOpenings = await db.query.cashMovement.findMany({
    where: eq(cashMovement.type, 'OPENING'),
    orderBy: desc(cashMovement.createdAt),
  });

  console.log(`Encontradas ${orphanedOpenings.length} aperturas de caja`);

  let closedCount = 0;

  for (const opening of orphanedOpenings) {
    const closing = await db.query.cashMovement.findFirst({
      where: and(
        eq(cashMovement.type, 'CLOSING'),
        gte(cashMovement.createdAt, opening.createdAt),
      ),
    });

    if (!closing) {
      // Calcular monto esperado al momento del cierre forzado
      const movements = await db.query.cashMovement.findMany({
        where: gte(cashMovement.createdAt, opening.createdAt),
      });

      let expectedAmount = Number(opening.amount);
      movements.forEach((m) => {
        if (m.type === 'INCOME') expectedAmount += Number(m.amount);
        if (m.type === 'EXPENSE') expectedAmount -= Number(m.amount);
      });

      // Crear cierre forzado con notas
      await db.insert(cashMovement).values({
        id: randomUUID(),
        type: 'CLOSING',
        amount: expectedAmount.toString(),
        method: 'CASH',
        referenceType: 'manual',
        reason: 'Cierre forzado por migración',
        notes: `Cierre automático de caja abierta el ${new Date(opening.createdAt).toISOString()}`,
        createdBy: 'SYSTEM_MIGRATION',
      });

      console.log(`✅ Cerrada caja abierta el ${new Date(opening.createdAt).toISOString()} - Monto: $${expectedAmount.toFixed(2)}`);
      closedCount++;
    }
  }

  if (closedCount === 0) {
    console.log('No se encontraron cajas abiertas sin cierre.');
  } else {
    console.log(`\n✨ Total de cajas cerradas: ${closedCount}`);
  }
}

closeOrphanedCashRegisters()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
