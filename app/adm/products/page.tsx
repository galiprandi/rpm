import { ProductsClient } from '@/components/products/ProductsClient';
import { type Product } from '@/components/products/types';
import { headers } from 'next/headers';

export default async function ProductsPage() {
  // Get base URL from headers for server-side fetch
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  // Fetch data from server in parallel
  const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
    fetch(`${baseUrl}/api/products`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/categories`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/suppliers`, { cache: 'no-store' }),
  ]);

  const [productsData, categoriesData, suppliersData] = await Promise.all([
    productsRes.json(),
    categoriesRes.json(),
    suppliersRes.json(),
  ]);

  const products: Product[] = productsData.products || [];
  const categories = categoriesData.categories || [];
  const suppliers = suppliersData.suppliers || [];

  // Calculate stats on server
  const lowStockCount = products.filter((p) => p.isLowStock).length;
  const totalInventoryValue = products.reduce(
    (acc, p) => acc + p.costPrice * (p.stock || 0),
    0
  );

  return (
    <ProductsClient
      products={products}
      categories={categories}
      suppliers={suppliers}
      lowStockCount={lowStockCount}
      totalInventoryValue={totalInventoryValue}
    />
  );
}
