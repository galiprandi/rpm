import { prisma } from "@/lib/prisma";
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
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ],
    },
    include: { category: true },
    orderBy: { name: "asc" },
    take: limit,
  });

  if (products.length === 0) return [];

  const priceLists = await prisma.price_list.findMany({
    where: { isActive: true },
  });

  const contadoList = priceLists.find(
    (pl) => pl.name.toLowerCase() === "contado",
  );
  const tarjetaList = priceLists.find((pl) =>
    pl.name.toLowerCase().includes("tarjeta"),
  );

  const productIds = products.map((p) => p.id);
  const exceptions = await prisma.price_list_item.findMany({
    where: {
      productId: { in: productIds },
      priceListId: { in: priceLists.map((pl) => pl.id) },
    },
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
