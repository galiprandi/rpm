import { db } from "@/lib/db";
import { product, priceList } from "@/db/schema";
import { eq, and, or, ilike, asc } from "drizzle-orm";
import { getProductBaseCost } from "@/lib/services/priceListService";
import { calculateBatchPrices } from "@/lib/services/priceCalculationService";

export interface ProductWithPrices {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  minStock: number;
  categoryName: string;
  contadoPrice: number | null;
  tarjetaPrice: number | null;
  replacementCost: number;
}

export async function searchProductsWithPricesService(
  search: string,
  limit: number = 10,
): Promise<ProductWithPrices[]> {
  const products = await db.query.product.findMany({
    where: and(
      eq(product.isActive, true),
      or(
        ilike(product.name, `%${search}%`),
        ilike(product.sku, `%${search}%`),
        ilike(product.barcode, `%${search}%`),
      ),
    ),
    with: {
      category: true,
    },
    orderBy: asc(product.name),
    limit,
  });

  if (products.length === 0) return [];

  // Load active price lists and find contado/tarjeta by name (backward compat
  // for the agent's output shape). Prices are computed via the centralized
  // service so basePriceListId chains and exceptions are resolved consistently.
  const priceLists = await db.query.priceList.findMany({
    where: eq(priceList.isActive, true),
    columns: { id: true, name: true },
  });

  const contadoList = priceLists.find(
    (pl) => pl.name.toLowerCase() === "contado",
  );
  const tarjetaList = priceLists.find((pl) =>
    pl.name.toLowerCase().includes("tarjeta"),
  );

  const targetListIds = [contadoList?.id, tarjetaList?.id].filter(
    (id): id is string => id !== undefined,
  );

  const productIds = products.map((p) => p.id);
  const priceMap =
    targetListIds.length > 0
      ? await calculateBatchPrices(productIds, targetListIds)
      : new Map<string, Map<string, any>>();

  return products.map((p) => {
    const baseCost = getProductBaseCost(p.replacementCost, p.costPrice);
    const productPrices = priceMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      minStock: p.minStock,
      categoryName: (p.category as any)?.name ?? "Sin categoría",
      contadoPrice: contadoList
        ? productPrices?.get(contadoList.id)?.finalPrice ?? null
        : null,
      tarjetaPrice: tarjetaList
        ? productPrices?.get(tarjetaList.id)?.finalPrice ?? null
        : null,
      replacementCost: baseCost,
    };
  });
}
