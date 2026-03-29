import { prisma } from '../lib/prisma';
import { nanoid } from '../lib/utils';

const categories = [
  { id: 'cat-1', name: 'Iluminación LED', description: 'Barras LED, faros auxiliares, tiras LED', defaultMarginPercent: 40, color: '#F59E0B', sortOrder: 1 },
  { id: 'cat-2', name: 'Estética Vehicular', description: 'Vinilos, polarizados, PPF', defaultMarginPercent: 50, color: '#3B82F6', sortOrder: 2 },
  { id: 'cat-3', name: 'Tratamientos Cerámicos', description: 'Cerámicos, selladores, protección de pintura', defaultMarginPercent: 60, color: '#8B5CF6', sortOrder: 3 },
  { id: 'cat-4', name: 'Limpieza Detallada', description: 'Productos de detailing, shampoos, microfibras', defaultMarginPercent: 50, color: '#10B981', sortOrder: 4 },
  { id: 'cat-5', name: 'Accesorios Off-Road', description: 'Snorkels, winches, protecciones, levantes', defaultMarginPercent: 35, color: '#EF4444', sortOrder: 5 },
];

const products = [
  // Iluminación LED
  { sku: 'LED-001', name: 'Barra LED 20 pulgadas 120W', categoryId: 'cat-1', costPrice: 45000, salePrice: 75000, stock: 15, minStock: 5, supplier: 'OSRAM Argentina' },
  { sku: 'LED-002', name: 'Barra LED 30 pulgadas 180W', categoryId: 'cat-1', costPrice: 65000, salePrice: 110000, stock: 8, minStock: 3, supplier: 'OSRAM Argentina' },
  { sku: 'LED-003', name: 'Faro auxiliar LED redondo 4"', categoryId: 'cat-1', costPrice: 15000, salePrice: 28000, stock: 25, minStock: 10, supplier: 'OSRAM Argentina' },
  { sku: 'LED-004', name: 'Tira LED interior 5m RGB', categoryId: 'cat-1', costPrice: 8000, salePrice: 15000, stock: 40, minStock: 15, supplier: 'LED Distribuciones' },

  // Estética Vehicular
  { sku: 'VIN-001', name: 'Polarizado NanoCeramic 3M', categoryId: 'cat-2', costPrice: 18000, salePrice: 35000, stock: 50, minStock: 10, supplier: '3M Argentina' },
  { sku: 'VIN-002', name: 'PPF (Paint Protection Film) capó', categoryId: 'cat-2', costPrice: 35000, salePrice: 65000, stock: 12, minStock: 3, supplier: 'XPEL Argentina' },
  { sku: 'VIN-003', name: 'Vinilo wrap negro mate', categoryId: 'cat-2', costPrice: 25000, salePrice: 48000, stock: 8, minStock: 2, supplier: 'Avery Dennison' },
  { sku: 'VIN-004', name: 'Polarizado seguridad antivandalico', categoryId: 'cat-2', costPrice: 22000, salePrice: 42000, stock: 20, minStock: 5, supplier: '3M Argentina' },

  // Tratamientos Cerámicos
  { sku: 'CER-001', name: 'Cerámico Gtechniq Crystal Serum', categoryId: 'cat-3', costPrice: 55000, salePrice: 95000, stock: 6, minStock: 2, supplier: 'Gtechniq Argentina' },
  { sku: 'CER-002', name: 'Cerámico CarPro Cquartz UK 3.0', categoryId: 'cat-3', costPrice: 42000, salePrice: 75000, stock: 10, minStock: 3, supplier: 'CarPro Argentina' },
  { sku: 'CER-003', name: 'Sellador híbrido siO2 Spray', categoryId: 'cat-3', costPrice: 8500, salePrice: 18000, stock: 30, minStock: 10, supplier: 'Detailing Shop' },

  // Limpieza Detallada
  { sku: 'DET-001', name: 'Shampoo pH neutro 5L', categoryId: 'cat-4', costPrice: 6500, salePrice: 12000, stock: 45, minStock: 15, supplier: 'Chemical Guys' },
  { sku: 'DET-002', name: 'Cera carnauba paste', categoryId: 'cat-4', costPrice: 9000, salePrice: 18000, stock: 20, minStock: 5, supplier: 'Meguiars' },
  { sku: 'DET-003', name: 'Microfibra 40x40 pack x5', categoryId: 'cat-4', costPrice: 3500, salePrice: 7500, stock: 100, minStock: 30, supplier: 'Detailing Tools' },
  { sku: 'DET-004', name: 'Limpiador APC multiuso 1L', categoryId: 'cat-4', costPrice: 4200, salePrice: 8500, stock: 35, minStock: 10, supplier: 'Chemical Guys' },

  // Accesorios Off-Road
  { sku: 'OFF-001', name: 'Snorkel Toyota Hilux 2016-2022', categoryId: 'cat-5', costPrice: 38000, salePrice: 65000, stock: 5, minStock: 2, supplier: 'Safari Snorkels' },
  { sku: 'OFF-002', name: 'Winch 12V 9500lbs', categoryId: 'cat-5', costPrice: 95000, salePrice: 165000, stock: 4, minStock: 2, supplier: 'Warn Winches' },
  { sku: 'OFF-003', name: 'Defensa delantera Bull Bar', categoryId: 'cat-5', costPrice: 75000, salePrice: 120000, stock: 3, minStock: 1, supplier: 'ARB Argentina' },
];

async function seed() {
  console.log('🌱 Iniciando seed...');

  // Insertar categorías
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: cat,
      create: cat,
    });
  }
  console.log(`✅ ${categories.length} categorías creadas`);

  // Insertar productos
  for (const prod of products) {
    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: prod,
      create: {
        ...prod,
        id: nanoid(),
      },
    });
  }
  console.log(`✅ ${products.length} productos creados`);

  console.log('🎉 Seed completado!');
}

seed()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
