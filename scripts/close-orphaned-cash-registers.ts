import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper para convertir Decimal a number
function decimalToNumber(decimal: unknown): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === 'number') return decimal;
  if (typeof decimal === 'object' && 'toNumber' in decimal && typeof decimal.toNumber === 'function') {
    return (decimal as { toNumber: () => number }).toNumber();
  }
  return 0;
}

async function closeOrphanedCashRegisters() {
  console.log('Buscando cajas abiertas sin cierre...');

  // Busca todos los OPENING sin CLOSING posterior
  const orphanedOpenings = await prisma.cash_movement.findMany({
    where: { type: 'OPENING' },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Encontradas ${orphanedOpenings.length} aperturas de caja`);

  let closedCount = 0;

  for (const opening of orphanedOpenings) {
    const closing = await prisma.cash_movement.findFirst({
      where: {
        type: 'CLOSING',
        createdAt: { gte: opening.createdAt },
      },
    });

    if (!closing) {
      // Calcular monto esperado al momento del cierre forzado
      const movements = await prisma.cash_movement.findMany({
        where: {
          createdAt: { gte: opening.createdAt },
        },
      });

      let expectedAmount = decimalToNumber(opening.amount);
      movements.forEach(m => {
        if (m.type === 'INCOME') expectedAmount += decimalToNumber(m.amount);
        if (m.type === 'EXPENSE') expectedAmount -= decimalToNumber(m.amount);
      });

      // Crear cierre forzado con notas
      await prisma.cash_movement.create({
        data: {
          type: 'CLOSING',
          amount: expectedAmount,
          method: 'CASH',
          referenceType: 'manual',
          reason: 'Cierre forzado por migración',
          notes: `Cierre automático de caja abierta el ${opening.createdAt.toISOString()}`,
          createdBy: 'SYSTEM_MIGRATION',
        },
      });

      console.log(`✅ Cerrada caja abierta el ${opening.createdAt.toISOString()} - Monto: $${expectedAmount.toFixed(2)}`);
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
    await prisma.$disconnect();
  });
