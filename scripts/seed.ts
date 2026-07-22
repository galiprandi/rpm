import { db } from '../lib/db';
import { category, supplier, setting, priceList, paymentMethod } from '../db/schema';

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
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const defaultSupplier = {
  id: 'rpm',
  name: 'RPM',
  contactName: "Augusto Bordier",
  phone: "3813199647",
  email: null as string | null,
  address: "San Lorenzo 1462, T4000 San Miguel de Tucumán",
  notes: '',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const defaultPriceList = {
  id: 'pl-contado',
  name: 'Contado',
  isPublic: true,
  isActive: true,
  baseMarginPercentage: '60.00',
  roundingRule: 'SMART_HUNDREDS',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const cardsPriceList = {
  id: 'pl-cards',
  name: 'Tarjetas',
  isPublic: true,
  isActive: true,
  baseMarginPercentage: '196.00',
  roundingRule: 'SMART_HUNDREDS',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const defaultPaymentMethods = [
  {
    id: 'pm-cash',
    code: 'CASH',
    name: 'Efectivo',
    description: 'Pago en efectivo',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

async function seed() {
  console.log('🌱 Iniciando seed mínimo...');

  // Crear categoría por defecto
  await db.insert(category)
    .values(defaultCategory)
    .onConflictDoUpdate({
      target: category.id,
      set: {
        name: defaultCategory.name,
        description: defaultCategory.description,
        defaultMarginPercent: defaultCategory.defaultMarginPercent,
        color: defaultCategory.color,
        sortOrder: defaultCategory.sortOrder,
        isActive: defaultCategory.isActive,
        updatedAt: defaultCategory.updatedAt,
      },
    });
  console.log(`✅ Categoría por defecto creada (${defaultCategory.name})`);

  // Crear proveedor por defecto
  await db.insert(supplier)
    .values(defaultSupplier)
    .onConflictDoUpdate({
      target: supplier.id,
      set: {
        name: defaultSupplier.name,
        contactName: defaultSupplier.contactName,
        phone: defaultSupplier.phone,
        email: defaultSupplier.email,
        address: defaultSupplier.address,
        notes: defaultSupplier.notes,
        isActive: defaultSupplier.isActive,
        updatedAt: defaultSupplier.updatedAt,
      },
    });
  console.log(`✅ Proveedor ${defaultSupplier.name} creado`);

  // Crear configuración de margen mínimo global
  await db.insert(setting)
    .values({
      id: 'setting-min-margin',
      key: 'MINIMUM_MARGIN_PERCENTAGE',
      value: '15.0',
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: setting.key,
      set: {
        value: '15.0',
        updatedAt: new Date().toISOString(),
      },
    });
  console.log('✅ Configuración de margen mínimo creada (15%)');

  // Crear lista de precios por defecto
  await db.insert(priceList)
    .values(defaultPriceList)
    .onConflictDoUpdate({
      target: priceList.id,
      set: {
        name: defaultPriceList.name,
        isPublic: defaultPriceList.isPublic,
        isActive: defaultPriceList.isActive,
        baseMarginPercentage: defaultPriceList.baseMarginPercentage,
        roundingRule: defaultPriceList.roundingRule,
        updatedAt: defaultPriceList.updatedAt,
      },
    });
  console.log(`✅ Lista de precios por defecto creada (${defaultPriceList.name})`);

  // Crear lista de precios para tarjetas
  await db.insert(priceList)
    .values(cardsPriceList)
    .onConflictDoUpdate({
      target: priceList.id,
      set: {
        name: cardsPriceList.name,
        isPublic: cardsPriceList.isPublic,
        isActive: cardsPriceList.isActive,
        baseMarginPercentage: cardsPriceList.baseMarginPercentage,
        roundingRule: cardsPriceList.roundingRule,
        updatedAt: cardsPriceList.updatedAt,
      },
    });
  console.log(`✅ Lista de precios para tarjetas creada (${cardsPriceList.name} - ${cardsPriceList.baseMarginPercentage}%)`);

  // Crear métodos de pago por defecto
  for (const pm of defaultPaymentMethods) {
    await db.insert(paymentMethod)
      .values(pm)
      .onConflictDoUpdate({
        target: paymentMethod.id,
        set: {
          code: pm.code,
          name: pm.name,
          description: pm.description,
          sortOrder: pm.sortOrder,
          isActive: pm.isActive,
          updatedAt: pm.updatedAt,
        },
      });
  }
  console.log(`✅ Métodos de pago por defecto creados (${defaultPaymentMethods.length} método${defaultPaymentMethods.length !== 1 ? 's' : ''})`);

  console.log('🎉 Seed completado! (0 productos creados - base de datos lista para desarrollo)');
}

seed()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
