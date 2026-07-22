import { db } from './lib/db';
import { product } from './db/schema';

async function createTestProducts() {
  console.log('🌱 Creando productos de prueba...');

  const testProducts = [
    {
      id: 'prod-001',
      sku: 'ACEITE-001',
      name: 'Aceite de Motor 5W-30',
      description: 'Aceite sintético para motor',
      barcode: '123456789001',
      replacementCost: '25.50',
      costPrice: '28.00',
      stock: 10,
      minStock: 5,
      categoryId: 'cat-default',
      supplierId: 'rpm',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-002',
      sku: 'FILTRO-001',
      name: 'Filtro de Aceite',
      description: 'Filtro de aceite para auto',
      barcode: '123456789002',
      replacementCost: '8.75',
      costPrice: '10.00',
      stock: 25,
      minStock: 10,
      categoryId: 'cat-default',
      supplierId: 'rpm',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-003',
      sku: 'BATERIA-001',
      name: 'Batería 12V 50Ah',
      description: 'Batería para automóvil',
      barcode: '123456789003',
      replacementCost: '85.00',
      costPrice: '95.00',
      stock: 5,
      minStock: 2,
      categoryId: 'cat-default',
      supplierId: 'rpm',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-004',
      sku: 'PASTILLA-001',
      name: 'Pastillas de Freno Delanteras',
      description: 'Juego de pastillas de freno',
      barcode: '123456789004',
      replacementCost: '32.00',
      costPrice: '38.00',
      stock: 15,
      minStock: 8,
      categoryId: 'cat-default',
      supplierId: 'rpm',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-005',
      sku: 'LIQUIDO-001',
      name: 'Líquido de Frenos DOT 4',
      description: 'Líquido de frenos de alta calidad',
      barcode: '123456789005',
      replacementCost: '5.25',
      costPrice: '6.50',
      stock: 30,
      minStock: 15,
      categoryId: 'cat-default',
      supplierId: 'rpm',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const productData of testProducts) {
    await db.insert(product)
      .values(productData)
      .onConflictDoUpdate({
        target: product.id,
        set: {
          sku: productData.sku,
          name: productData.name,
          description: productData.description,
          barcode: productData.barcode,
          replacementCost: productData.replacementCost,
          costPrice: productData.costPrice,
          stock: productData.stock,
          minStock: productData.minStock,
          categoryId: productData.categoryId,
          supplierId: productData.supplierId,
          isActive: productData.isActive,
          updatedAt: productData.updatedAt,
        },
      });
    console.log(`✅ Producto creado: ${productData.name}`);
  }

  console.log('🎉 Productos de prueba creados!');
}

createTestProducts()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
