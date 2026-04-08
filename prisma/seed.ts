import { prisma } from '../lib/prisma';

/**
 * Seed mínimo para desarrollo
 * Crea solo los registros esenciales para permitir la creación de productos
 */

const defaultCategory = {
  id: 'cat-default',
  name: 'Sin categoría',
  description: 'Categoría por defecto para productos sin categoría específica',
  defaultMarginPercent: 30,
  color: '#6b7280',
  sortOrder: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const defaultSupplier = {
  id: 'sup-default',
  name: 'Sin especificar',
  contactName: null,
  phone: null,
  email: null,
  address: null,
  notes: 'Proveedor por defecto para productos sin proveedor específico',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const defaultPriceList = {
  id: 'pl-default',
  name: 'Lista General',
  isPublic: true,
  isActive: true,
  baseMarginPercentage: 40.00,
  roundingRule: 'SMART_HUNDREDS',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const defaultPaymentMethods = [
  {
    id: 'pm-efectivo',
    code: 'EFECTIVO',
    name: 'Efectivo',
    description: 'Pago en efectivo',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pm-tarjeta-credito',
    code: 'TARJETA_CREDITO',
    name: 'Tarjeta de Crédito',
    description: 'Pago con tarjeta de crédito',
    sortOrder: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pm-tarjeta-debito',
    code: 'TARJETA_DEBITO',
    name: 'Tarjeta de Débito',
    description: 'Pago con tarjeta de débito',
    sortOrder: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pm-transferencia',
    code: 'TRANSFERENCIA',
    name: 'Transferencia Bancaria',
    description: 'Pago por transferencia bancaria',
    sortOrder: 4,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pm-mp',
    code: 'MERCADO_PAGO',
    name: 'Mercado Pago',
    description: 'Pago a través de Mercado Pago',
    sortOrder: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function seed() {
  console.log('🌱 Iniciando seed mínimo...');

  // Crear categoría por defecto
  await prisma.category.upsert({
    where: { id: defaultCategory.id },
    update: defaultCategory,
    create: defaultCategory,
  });
  console.log('✅ Categoría por defecto creada');

  // Crear proveedor por defecto
  await prisma.supplier.upsert({
    where: { id: defaultSupplier.id },
    update: defaultSupplier,
    create: {
      ...defaultSupplier,
      id: defaultSupplier.id,
    },
  });
  console.log('✅ Proveedor por defecto creado');

  // Crear configuración de margen mínimo global
  await prisma.setting.upsert({
    where: { key: 'MINIMUM_MARGIN_PERCENTAGE' },
    update: { value: '15.0', updatedAt: new Date() },
    create: {
      id: 'setting-min-margin',
      key: 'MINIMUM_MARGIN_PERCENTAGE',
      value: '15.0',
      updatedAt: new Date(),
    },
  });
  console.log('✅ Configuración de margen mínimo creada (15%)');

  // Crear lista de precios por defecto
  await prisma.price_list.upsert({
    where: { id: defaultPriceList.id },
    update: defaultPriceList,
    create: defaultPriceList,
  });
  console.log('✅ Lista de precios por defecto creada (Lista General)');

  // Crear métodos de pago por defecto
  for (const pm of defaultPaymentMethods) {
    await prisma.payment_method.upsert({
      where: { id: pm.id },
      update: pm,
      create: pm,
    });
  }
  console.log('✅ Métodos de pago por defecto creados (5 métodos)');

  console.log('🎉 Seed completado! (0 productos creados - base de datos lista para desarrollo)');
}

seed()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
