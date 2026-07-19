import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean up previous print test invoices if any
  await prisma.invoice.deleteMany({
    where: {
      OR: [
        { referenceId: 'manual-p' },
        { referenceId: 'manual-r' },
        { number: 'PRES-00000001' },
        { number: 'REM-00000001' }
      ]
    }
  });

  // Create or get customer
  let customer = await prisma.customer.findFirst({
    where: { name: 'Juan Pérez' }
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: 'Juan Pérez',
        phone: '2994444555',
        email: 'juan@example.com',
        address: 'Ruta 151 Km 3, Cipolletti, Río Negro',
        billingData: {
          cuit: '20123456789',
          invoiceType: 'A'
        },
        updatedAt: new Date()
      }
    });
  } else {
    // Ensure contact info is present
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        phone: '2994444555',
        email: 'juan@example.com',
        address: 'Ruta 151 Km 3, Cipolletti, Río Negro',
      }
    });
  }

  // Create PRESUPUESTO
  const presupuesto = await prisma.invoice.create({
    data: {
      number: 'PRES-00000001',
      type: 'PRESUPUESTO',
      referenceId: 'manual-p',
      referenceType: 'work_order',
      customerId: customer.id,
      customerName: customer.name,
      customerDoc: '20123456789',
      customerDocType: 'CUIT',
      subtotal: 50000,
      tax: 10500,
      total: 60500,
      status: 'DRAFT',
      createdBy: 'test-user',
      iva21: 10500
    }
  });

  // Create REMITO
  const remito = await prisma.invoice.create({
    data: {
      number: 'REM-00000001',
      type: 'REMITO',
      referenceId: 'manual-r',
      referenceType: 'work_order',
      customerId: customer.id,
      customerName: customer.name,
      customerDoc: '20123456789',
      customerDocType: 'CUIT',
      subtotal: 25000,
      tax: 0,
      total: 25000,
      status: 'DRAFT',
      createdBy: 'test-user'
    }
  });

  console.log('PRINT TEST SEED COMPLETED!');
  console.log('PRESUPUESTO ID:', presupuesto.id);
  console.log('REMITO ID:', remito.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
