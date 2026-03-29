import { prisma } from '../lib/prisma';
import { nanoid } from '../lib/utils';

const categories = [
  { id: 'cat-1', name: 'Iluminación LED', description: 'Barras LED, faros auxiliares, tiras LED', defaultMarginPercent: 40, color: '#F59E0B', sortOrder: 1 },
  { id: 'cat-2', name: 'Estética Vehicular', description: 'Vinilos, polarizados, PPF', defaultMarginPercent: 50, color: '#3B82F6', sortOrder: 2 },
  { id: 'cat-3', name: 'Tratamientos Cerámicos', description: 'Cerámicos, selladores, protección de pintura', defaultMarginPercent: 60, color: '#8B5CF6', sortOrder: 3 },
  { id: 'cat-4', name: 'Limpieza Detallada', description: 'Productos de detailing, shampoos, microfibras', defaultMarginPercent: 50, color: '#10B981', sortOrder: 4 },
  { id: 'cat-5', name: 'Accesorios Off-Road', description: 'Snorkels, winches, protecciones, levantes', defaultMarginPercent: 35, color: '#EF4444', sortOrder: 5 },
];

const suppliers = [
  { id: 'sup-default', name: 'Sin especificar', contactName: null, phone: null, email: null, address: null, notes: 'Proveedor por defecto para productos sin proveedor específico' },
  { id: 'sup-osram', name: 'OSRAM Argentina', contactName: 'Juan Pérez', phone: '+54 11 4567-8900', email: 'ventas@osram.ar', address: 'Av. del Libertador 1234, CABA' },
  { id: 'sup-3m', name: '3M Argentina', contactName: 'María González', phone: '+54 11 5678-9012', email: 'contacto@3m.ar', address: 'Ruta Panamericana Km 25, Buenos Aires' },
  { id: 'sup-xpel', name: 'XPEL Argentina', contactName: 'Carlos Rodríguez', phone: '+54 11 6789-0123', email: 'info@xpel.ar', address: 'Av. Córdoba 5678, CABA' },
  { id: 'sup-avery', name: 'Avery Dennison', contactName: 'Laura Martínez', phone: '+54 11 7890-1234', email: 'ventas@avery.ar', address: 'Av. Santa Fe 9012, CABA' },
  { id: 'sup-gtechniq', name: 'Gtechniq Argentina', contactName: 'Diego Fernández', phone: '+54 11 8901-2345', email: 'hola@gtechniq.ar', address: 'Av. Libertador 3456, Vicente López' },
  { id: 'sup-carpro', name: 'CarPro Argentina', contactName: 'Ana López', phone: '+54 11 9012-3456', email: 'contacto@carpro.ar', address: 'Av. Cabildo 7890, CABA' },
  { id: 'sup-detailing', name: 'Detailing Shop', contactName: 'Roberto Silva', phone: '+54 11 0123-4567', email: 'info@detailingshop.ar', address: 'Av. Corrientes 4567, CABA' },
  { id: 'sup-chemical', name: 'Chemical Guys', contactName: 'Pedro Gómez', phone: '+54 11 1234-5678', email: 'ventas@chemicalguys.ar', address: 'Av. San Martín 8901, CABA' },
  { id: 'sup-meguiars', name: 'Meguiars', contactName: 'Sofia Torres', phone: '+54 11 2345-6789', email: 'info@meguiars.ar', address: 'Av. Rivadavia 2345, CABA' },
  { id: 'sup-detailingtools', name: 'Detailing Tools', contactName: 'Miguel Sánchez', phone: '+54 11 3456-7890', email: 'ventas@detailingtools.ar', address: 'Av. Belgrano 6789, CABA' },
  { id: 'sup-safari', name: 'Safari Snorkels', contactName: 'José Ramírez', phone: '+54 11 4567-8901', email: 'info@safarisnorkels.ar', address: 'Av. Warnes 1234, CABA' },
  { id: 'sup-warn', name: 'Warn Winches', contactName: 'Luis Hernández', phone: '+54 11 5678-9012', email: 'ventas@warn.ar', address: 'Av. del Libertador 5678, CABA' },
  { id: 'sup-arb', name: 'ARB Argentina', contactName: 'Fernando Díaz', phone: '+54 11 6789-0123', email: 'info@arb.ar', address: 'Av. Lacroze 9012, CABA' },
  { id: 'sup-leddist', name: 'LED Distribuciones', contactName: 'Gabriela Ruiz', phone: '+54 11 7890-1234', email: 'ventas@leddist.ar', address: 'Av. Córdoba 3456, CABA' },
];

const products = [
  // Iluminación LED
  { sku: 'LED-001', name: 'Barra LED 20 pulgadas 120W', categoryId: 'cat-1', supplierId: 'sup-osram', costPrice: 45000, salePrice: 75000, stock: 15, minStock: 5 },
  { sku: 'LED-002', name: 'Barra LED 30 pulgadas 180W', categoryId: 'cat-1', supplierId: 'sup-osram', costPrice: 65000, salePrice: 110000, stock: 8, minStock: 3 },
  { sku: 'LED-003', name: 'Faro auxiliar LED redondo 4"', categoryId: 'cat-1', supplierId: 'sup-osram', costPrice: 15000, salePrice: 28000, stock: 25, minStock: 10 },
  { sku: 'LED-004', name: 'Tira LED interior 5m RGB', categoryId: 'cat-1', supplierId: 'sup-leddist', costPrice: 8000, salePrice: 15000, stock: 40, minStock: 15 },

  // Estética Vehicular
  { sku: 'VIN-001', name: 'Polarizado NanoCeramic 3M', categoryId: 'cat-2', supplierId: 'sup-3m', costPrice: 18000, salePrice: 35000, stock: 50, minStock: 10 },
  { sku: 'VIN-002', name: 'PPF (Paint Protection Film) capó', categoryId: 'cat-2', supplierId: 'sup-xpel', costPrice: 35000, salePrice: 65000, stock: 12, minStock: 3 },
  { sku: 'VIN-003', name: 'Vinilo wrap negro mate', categoryId: 'cat-2', supplierId: 'sup-avery', costPrice: 25000, salePrice: 48000, stock: 8, minStock: 2 },
  { sku: 'VIN-004', name: 'Polarizado seguridad antivandalico', categoryId: 'cat-2', supplierId: 'sup-3m', costPrice: 22000, salePrice: 42000, stock: 20, minStock: 5 },

  // Tratamientos Cerámicos
  { sku: 'CER-001', name: 'Cerámico Gtechniq Crystal Serum', categoryId: 'cat-3', supplierId: 'sup-gtechniq', costPrice: 55000, salePrice: 95000, stock: 6, minStock: 2 },
  { sku: 'CER-002', name: 'Cerámico CarPro Cquartz UK 3.0', categoryId: 'cat-3', supplierId: 'sup-carpro', costPrice: 42000, salePrice: 75000, stock: 10, minStock: 3 },
  { sku: 'CER-003', name: 'Sellador híbrido siO2 Spray', categoryId: 'cat-3', supplierId: 'sup-detailing', costPrice: 8500, salePrice: 18000, stock: 30, minStock: 10 },

  // Limpieza Detallada
  { sku: 'DET-001', name: 'Shampoo pH neutro 5L', categoryId: 'cat-4', supplierId: 'sup-chemical', costPrice: 6500, salePrice: 12000, stock: 45, minStock: 15 },
  { sku: 'DET-002', name: 'Cera carnauba paste', categoryId: 'cat-4', supplierId: 'sup-meguiars', costPrice: 9000, salePrice: 18000, stock: 20, minStock: 5 },
  { sku: 'DET-003', name: 'Microfibra 40x40 pack x5', categoryId: 'cat-4', supplierId: 'sup-detailingtools', costPrice: 3500, salePrice: 7500, stock: 100, minStock: 30 },
  { sku: 'DET-004', name: 'Limpiador APC multiuso 1L', categoryId: 'cat-4', supplierId: 'sup-chemical', costPrice: 4200, salePrice: 8500, stock: 35, minStock: 10 },

  // Accesorios Off-Road
  { sku: 'OFF-001', name: 'Snorkel Toyota Hilux 2016-2022', categoryId: 'cat-5', supplierId: 'sup-safari', costPrice: 38000, salePrice: 65000, stock: 5, minStock: 2 },
  { sku: 'OFF-002', name: 'Winch 12V 9500lbs', categoryId: 'cat-5', supplierId: 'sup-warn', costPrice: 95000, salePrice: 165000, stock: 4, minStock: 2 },
  { sku: 'OFF-003', name: 'Defensa delantera Bull Bar', categoryId: 'cat-5', supplierId: 'sup-arb', costPrice: 75000, salePrice: 120000, stock: 3, minStock: 1 },
  
  // Producto con proveedor "Sin especificar" para permitir crear productos sin proveedor específico
  { sku: 'MISC-001', name: 'Producto de prueba - Sin proveedor específico', categoryId: 'cat-5', supplierId: 'sup-default', costPrice: 10000, salePrice: 15000, stock: 5, minStock: 2 },
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

  // Insertar proveedores
  for (const sup of suppliers) {
    await prisma.supplier.upsert({
      where: { id: sup.id },
      update: sup,
      create: {
        ...sup,
        id: sup.id,
      },
    });
  }
  console.log(`✅ ${suppliers.length} proveedores creados`);

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
