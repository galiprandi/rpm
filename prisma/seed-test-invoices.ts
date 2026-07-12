
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean up
  await prisma.invoice.deleteMany({
    where: { OR: [
        { number: { startsWith: 'X-0001-0000000' } },
        { number: { startsWith: '0001-' } }
    ]}
  });

  const customer = await prisma.customer.create({
    data: {
      name: 'Cliente de Prueba RI',
      billingData: {
        cuit: '20123456789',
        invoiceType: 'A'
      },
      updatedAt: new Date()
    }
  });

  // Create some pre-invoices
  for (let i = 1; i <= 3; i++) {
    await prisma.invoice.create({
      data: {
        number: `X-0001-0000000${i}`,
        type: 'X_A',
        referenceId: `manual-ref-${i}`,
        referenceType: 'direct_sale',
        customerId: customer.id,
        customerName: customer.name,
        customerDoc: '20123456789',
        customerDocType: 'CUIT',
        subtotal: 1000 * i,
        tax: 210 * i,
        total: 1210 * i,
        status: 'DRAFT',
        createdBy: 'test-user',
        iva21: 210 * i
      }
    });
  }

  // Also set AFIP settings
  await prisma.setting.upsert({
    where: { key: 'AFIP_CUIT' },
    update: { value: '30123456789' },
    create: { id: 'afip-cuit-1', key: 'AFIP_CUIT', value: '30123456789', updatedAt: new Date() }
  });
  await prisma.setting.upsert({
    where: { key: 'AFIP_PUNTO_VENTA' },
    update: { value: '1' },
    create: { id: 'afip-pv-1', key: 'AFIP_PUNTO_VENTA', value: '1', updatedAt: new Date() }
  });

  console.log('Seed data created: 3 pre-invoices and AFIP settings');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
