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
  color: '#6B7280',
  sortOrder: 0,
};

const defaultSupplier = {
  id: 'sup-default',
  name: 'Sin especificar',
  contactName: null,
  phone: null,
  email: null,
  address: null,
  notes: 'Proveedor por defecto para productos sin proveedor específico',
};

const adminUser = {
  id: 'user-german',
  name: 'Germán Aliprandi',
  email: 'galiprandi@gmail.com',
  emailVerified: true,
  image: null,
};

const adminRole = {
  email: 'galiprandi@gmail.com',
  role: 'ADMIN',
  name: 'Germán Aliprandi',
  notes: 'Administrador del sistema',
  isActive: true,
};

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

  // Crear usuario administrador
  await prisma.user.upsert({
    where: { id: adminUser.id },
    update: adminUser,
    create: adminUser,
  });
  console.log('✅ Usuario administrador creado (Germán Aliprandi)');

  // Crear rol ADMIN para el usuario
  await prisma.userRole.upsert({
    where: { email: adminRole.email },
    update: adminRole,
    create: adminRole,
  });
  console.log('✅ Rol ADMIN asignado');

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
