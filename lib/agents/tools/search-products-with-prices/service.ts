import { db } from "@/lib/db";
import { product, priceList, priceListItem } from "@/db/schema";
import { eq, and, or, ilike, asc, inArray } from "drizzle-orm";
import { getProductBaseCost } from "@/lib/services/priceListService";
import { calculateFinalPrice, type RoundingRule } from "@/lib/utils/rounding";

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

  const priceLists = await db.query.priceList.findMany({
    where: eq(priceList.isActive, true),
  });

  const contadoList = priceLists.find(
    (pl) => pl.name.toLowerCase() === "contado",
  );
  const tarjetaList = priceLists.find((pl) =>
    pl.name.toLowerCase().includes("tarjeta"),
  );

  const productIds = products.map((p) => p.id);
  const exceptions = await db.query.priceListItem.findMany({
    where: and(
      inArray(priceListItem.productId, productIds),
      inArray(priceListItem.priceListId, priceLists.map((pl) => pl.id)),
    ),
  });

  const exceptionMap = new Map<
    string,
    Map<string, { fixedPrice: number | null; overrideMargin: number | null }>
  >();
  for (const ex of exceptions) {
    if (!ex.productId) continue;
    if (!exceptionMap.has(ex.priceListId))
      exceptionMap.set(ex.priceListId, new Map());
    exceptionMap.get(ex.priceListId)!.set(ex.productId, {
      fixedPrice: ex.fixedPrice !== null ? Number(ex.fixedPrice) : null,
      overrideMargin:
        ex.overrideMarginPercentage !== null
          ? Number(ex.overrideMarginPercentage)
          : null,
    });
  }

  function calcPrice(
    productId: string,
    baseCost: number,
    list: typeof contadoList,
  ): number | null {
    if (!list) return null;
    const ex = exceptionMap.get(list.id)?.get(productId);
    return calculateFinalPrice(
      baseCost,
      Number(list.baseMarginPercentage),
      list.roundingRule as RoundingRule,
      ex?.fixedPrice != null
        ? { fixedPrice: ex.fixedPrice }
        : ex?.overrideMargin != null
          ? { overrideMarginPercentage: ex.overrideMargin }
          : undefined,
    );
  }

  return products.map((p) => {
    const baseCost = getProductBaseCost(p.replacementCost, p.costPrice);
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      minStock: p.minStock,
      categoryName: p.category?.name ?? "Sin categoría",
      contadoPrice: calcPrice(p.id, baseCost, contadoList),
      tarjetaPrice: calcPrice(p.id, baseCost, tarjetaList),
      replacementCost: baseCost,
    };
  });
}
