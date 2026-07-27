import { ProductsClient } from "@/components/products/ProductsClient";
import { type Product } from "@/components/products/types";
import { getProducts } from "@/lib/services/productService";
import { getCategories } from "@/lib/services/categoryService";
import { getSuppliers } from "@/lib/services/supplierService";
import { requireAuth } from "@/lib/auth-server";
import { UserRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ lowStock?: string }>;
}) {
  const session = await requireAuth();
  const userRole =
    ((session.user as { role?: string }).role as UserRole) || UserRole.USER;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF && userRole !== UserRole.VENDEDOR) {
    throw new Error("Acceso denegado");
  }

  const resolvedSearchParams = await searchParams;
  const lowStockParam = resolvedSearchParams?.lowStock === "true";

  // Fetch data from services in parallel
  const [productsData, categoriesData, suppliersData] = await Promise.all([
    getProducts({ isActive: true }),
    getCategories(),
    getSuppliers(),
  ]);

  const products = productsData.products as Product[];
  const categories = categoriesData.categories;
  const suppliers = suppliersData.suppliers;

  return (
    <ProductsClient
      products={products}
      categories={categories}
      suppliers={suppliers}
      initialLowStockFilter={lowStockParam}
    />
  );
}
