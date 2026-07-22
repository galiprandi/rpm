/**
 * API Route: /api/products-services/search
 * Method: GET
 * Query params: q, categoryId, priceListId, limit
 * Spec: /specs/components/product-service-selector.md
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { priceList, product, service, priceListItem } from "@/db/schema";
import { eq, ilike, or, and, asc, inArray, type SQL } from "drizzle-orm";
import {
  calculateFinalPrice,
  calculateMarginPercentage,
  type RoundingRule,
} from "@/lib/utils/rounding";
import { getProductBaseCost } from "@/lib/services/priceListService";
import { getMinimumMargin } from "@/lib/services/settingsService";
import { parseSearchQuery } from "@/lib/utils/searchQueryParser";

export const dynamic = "force-dynamic";

interface PriceInfo {
  finalPrice: number;
  isBelowMinimum: boolean;
  isFixed: boolean;
  overrideMargin: number | null;
  roundingRule: RoundingRule;
}

interface SearchResult {
  id: string;
  type: "product" | "service";
  name: string;
  basePrice: number;
  // Productos
  sku?: string;
  ean?: string;
  stock?: number;
  categoryId?: string;
  categoryName?: string;
  replacementCost?: number;
  costPrice?: number;
  // Servicios
  description?: string;
  // Precios calculados para todas las listas
  allPrices: Record<string, PriceInfo>;
  minimumPrice?: number;
}

// GET /api/products-services/search?q=term&categoryId=xxx&priceListId=xxx&limit=20
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const q = searchParams.get("q")?.trim();
    const categoryId = searchParams.get("categoryId");
    const priceListId = searchParams.get("priceListId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    // Obtener lista de precios seleccionada y todas las listas activas (siempre cacheamos todos los precios)
    let selectedPriceList: {
      id: string;
      baseMarginPercentage: number;
      roundingRule: RoundingRule;
    } | null = null;
    const allActivePriceLists: Array<{
      id: string;
      baseMarginPercentage: number;
      roundingRule: RoundingRule;
    }> = [];

    const lists = await db.query.priceList.findMany({
      where: eq(priceList.isActive, true),
      orderBy: asc(priceList.name),
    });

    for (const pl of lists) {
      const listData = {
        id: pl.id,
        baseMarginPercentage: Number(pl.baseMarginPercentage),
        roundingRule: pl.roundingRule as RoundingRule,
      };
      allActivePriceLists.push(listData);
      if (pl.id === priceListId) {
        selectedPriceList = listData;
      }
    }

    // Build search conditions for a column
    function buildColumnConditions(
      terms: ReturnType<typeof parseSearchQuery>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      column: any,
    ): SQL[] {
      const conditions: SQL[] = [];

      // Phrases must be present as exact substrings
      for (const phrase of terms.phrases) {
        conditions.push(ilike(column, `%${phrase}%`));
      }

      // Required terms must be present
      for (const term of terms.required) {
        conditions.push(ilike(column, `%${term}%`));
      }

      // If we have optional terms, at least one must match (but only if no required/phrases)
      if (
        terms.optional.length > 0 &&
        terms.required.length === 0 &&
        terms.phrases.length === 0
      ) {
        conditions.push(or(...terms.optional.map((term) => ilike(column, `%${term}%`)))!);
      } else if (terms.optional.length > 0) {
        // Optional terms when we have required/phrases - they just expand the match
        // but aren't mandatory
        conditions.push(or(...terms.optional.map((term) => ilike(column, `%${term}%`)))!);
      }

      return conditions;
    }

    const searchTerms = q ? parseSearchQuery(q) : null;

    // Buscar productos
    let productWhere: SQL | undefined = eq(product.isActive, true);

    if (searchTerms) {
      const nameConditions = buildColumnConditions(searchTerms, product.name);
      const skuConditions = buildColumnConditions(searchTerms, product.sku);
      const barcodeConditions = buildColumnConditions(searchTerms, product.barcode);

      // Combine with OR across fields, but each field must satisfy all its conditions
      const allFieldConditions = [
        ...nameConditions,
        ...skuConditions,
        ...barcodeConditions,
      ];

      if (allFieldConditions.length > 0) {
        // If we have required terms or phrases, use AND logic
        if (searchTerms.required.length > 0 || searchTerms.phrases.length > 0) {
          // Group required conditions - all must match across any field
          const requiredAndPhrases: SQL[] = [
            ...searchTerms.phrases.map((phrase) =>
              or(
                ilike(product.name, `%${phrase}%`),
                ilike(product.sku, `%${phrase}%`),
                ilike(product.barcode, `%${phrase}%`),
              )!,
            ),
            ...searchTerms.required.map((term) =>
              or(
                ilike(product.name, `%${term}%`),
                ilike(product.sku, `%${term}%`),
                ilike(product.barcode, `%${term}%`),
              )!,
            ),
          ];

          const conditions = [eq(product.isActive, true), ...requiredAndPhrases];

          // Optional terms can match in any field (for relevance boost)
          if (searchTerms.optional.length > 0) {
            const optionalStr = searchTerms.optional.join(" ");
            conditions.push(
              or(
                ilike(product.name, `%${optionalStr}%`),
                ilike(product.sku, `%${optionalStr}%`),
                ilike(product.barcode, `%${optionalStr}%`),
              )!,
            );
          }

          productWhere = and(...conditions);
        } else {
          // Only optional terms - OR logic
          productWhere = and(
            eq(product.isActive, true),
            or(
              ilike(product.name, `%${q}%`),
              ilike(product.sku, `%${q}%`),
              ilike(product.barcode, `%${q}%`),
            ),
          );
        }
      }
    }

    if (categoryId) {
      productWhere = productWhere
        ? and(productWhere, eq(product.categoryId, categoryId))
        : eq(product.categoryId, categoryId);
    }

    const products = await db.query.product.findMany({
      where: productWhere,
      limit,
      orderBy: asc(product.name),
      with: {
        category: true,
      },
    });

    // Buscar servicios (solo si hay término de búsqueda o si no hay filtro de categoría)
    let services: Array<{
      id: string;
      name: string;
      baseCost: unknown;
      description: string | null;
    }> = [];

    if (!categoryId) {
      let serviceWhere: SQL | undefined = eq(service.isActive, true);

      if (searchTerms) {
        if (searchTerms.required.length > 0 || searchTerms.phrases.length > 0) {
          // Required/phrases must match in name OR description
          const requiredConditions: SQL[] = [
            ...searchTerms.phrases.map((phrase) =>
              or(
                ilike(service.name, `%${phrase}%`),
                ilike(service.description, `%${phrase}%`),
              )!,
            ),
            ...searchTerms.required.map((term) =>
              or(
                ilike(service.name, `%${term}%`),
                ilike(service.description, `%${term}%`),
              )!,
            ),
          ];

          serviceWhere = and(eq(service.isActive, true), ...requiredConditions);
        } else if (searchTerms.optional.length > 0) {
          // Only optional terms - match in name OR description
          serviceWhere = and(
            eq(service.isActive, true),
            or(
              ilike(service.name, `%${q}%`),
              ilike(service.description, `%${q}%`),
            ),
          );
        }
      }

      const rawServices = await db.query.service.findMany({
        where: serviceWhere,
        limit,
        orderBy: asc(service.name),
      });

      services = rawServices.map((s) => ({
        id: s.id,
        name: s.name,
        baseCost: Number(s.baseCost),
        description: s.description,
      }));
    }

    // Obtener excepciones de lista de precios para los productos encontrados
    const priceExceptions: Map<
      string,
      { fixedPrice: number | null; overrideMarginPercentage: number | null }
    > = new Map();

    if (priceListId && products.length > 0) {
      const productIds = products.map((p) => p.id);
      const exceptions = await db.query.priceListItem.findMany({
        where: and(
          eq(priceListItem.priceListId, priceListId),
          inArray(priceListItem.productId, productIds),
        ),
      });

      for (const ex of exceptions) {
        if (ex.productId) {
          priceExceptions.set(ex.productId, {
            fixedPrice: ex.fixedPrice !== null ? Number(ex.fixedPrice) : null,
            overrideMarginPercentage:
              ex.overrideMarginPercentage !== null
                ? Number(ex.overrideMarginPercentage)
                : null,
          });
        }
      }
    }

    // Obtener excepciones para TODAS las listas
    const allExceptions: Map<
      string,
      Map<
        string,
        { fixedPrice: number | null; overrideMarginPercentage: number | null }
      >
    > = new Map();

    if (products.length > 0 && allActivePriceLists.length > 0) {
      const productIds = products.map((p) => p.id);
      const allListIds = allActivePriceLists.map((pl) => pl.id);

      const exceptions = await db.query.priceListItem.findMany({
        where: and(
          inArray(priceListItem.priceListId, allListIds),
          inArray(priceListItem.productId, productIds),
        ),
      });

      for (const ex of exceptions) {
        if (ex.productId) {
          if (!allExceptions.has(ex.priceListId)) {
            allExceptions.set(ex.priceListId, new Map());
          }
          allExceptions.get(ex.priceListId)!.set(ex.productId, {
            fixedPrice: ex.fixedPrice !== null ? Number(ex.fixedPrice) : null,
            overrideMarginPercentage:
              ex.overrideMarginPercentage !== null
                ? Number(ex.overrideMarginPercentage)
                : null,
          });
        }
      }
    }

    // Obtener margen mínimo global
    const minimumMargin = await getMinimumMargin();

    // Función helper para calcular precio de un producto para una lista específica
    const calculateProductPriceForList = (
      product: (typeof products)[0],
      baseCost: number,
      list: {
        id: string;
        baseMarginPercentage: number;
        roundingRule: RoundingRule;
      },
      exception?: {
        fixedPrice: number | null;
        overrideMarginPercentage: number | null;
      },
    ): PriceInfo => {
      let finalPrice: number;
      let isFixed = false;
      let overrideMargin: number | null = null;

      if (
        exception?.fixedPrice !== null &&
        exception?.fixedPrice !== undefined
      ) {
        finalPrice = exception.fixedPrice;
        isFixed = true;
      } else {
        if (
          exception?.overrideMarginPercentage !== null &&
          exception?.overrideMarginPercentage !== undefined
        ) {
          overrideMargin = exception.overrideMarginPercentage;
        }
        finalPrice = calculateFinalPrice(
          baseCost,
          list.baseMarginPercentage,
          list.roundingRule,
          overrideMargin !== null
            ? { overrideMarginPercentage: overrideMargin }
            : undefined,
        );
      }

      const actualMargin = calculateMarginPercentage(baseCost, finalPrice);
      const isBelowMinimum = actualMargin < minimumMargin;

      return {
        finalPrice,
        isBelowMinimum,
        isFixed,
        overrideMargin,
        roundingRule: list.roundingRule,
      };
    };

    // Transformar productos
    const productResults: SearchResult[] = products.map((product: any) => {
      const baseCost = getProductBaseCost(
        product.replacementCost,
        product.costPrice,
      );

      // Calcular minimumPrice (precio con margen mínimo)
      const minimumPrice = calculateFinalPrice(
        baseCost,
        minimumMargin,
        "EXACT", // Sin redondeo especial para precio mínimo
      );

      let finalPrice: number;
      let isBelowMinimum = false;

      if (selectedPriceList) {
        const exception = priceExceptions.get(product.id);
        const priceInfo = calculateProductPriceForList(
          product,
          baseCost,
          selectedPriceList,
          exception,
        );
        finalPrice = priceInfo.finalPrice;
        isBelowMinimum = priceInfo.isBelowMinimum;
      } else {
        // Precio por defecto: 40% margen sobre costo
        finalPrice = baseCost * 1.4;
        const actualMargin = calculateMarginPercentage(baseCost, finalPrice);
        isBelowMinimum = actualMargin < minimumMargin;
      }

      // Calcular allPrices para todas las listas
      const allPrices: Record<string, PriceInfo> = {};
      if (allActivePriceLists.length > 0) {
        for (const list of allActivePriceLists) {
          const listExceptions = allExceptions.get(list.id);
          const exception = listExceptions?.get(product.id);
          allPrices[list.id] = calculateProductPriceForList(
            product,
            baseCost,
            list,
            exception,
          );
        }
      }

      return {
        id: product.id,
        type: "product",
        name: product.name,
        basePrice: finalPrice,
        minimumPrice,
        isBelowMinimum,
        allPrices,
        sku: product.sku || undefined,
        ean: product.barcode || undefined,
        stock: product.stock,
        categoryId: product.categoryId || undefined,
        categoryName: product.category?.name || undefined,
        replacementCost: Number(product.replacementCost) || undefined,
        costPrice: Number(product.costPrice) || undefined,
      };
    });

    // Transformar servicios (precio fijo, no depende de listas)
    const serviceResults: SearchResult[] = services.map((service) => ({
      id: service.id,
      type: "service",
      name: service.name,
      basePrice: service.baseCost as number,
      description: service.description || undefined,
      allPrices: {}, // Servicios no tienen precios variables por lista
    }));

    // Combinar y ordenar resultados (si hay búsqueda, ordenar por relevancia)
    const results: SearchResult[] = [...productResults, ...serviceResults];

    // Ordenar alfabéticamente por nombre
    results.sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error in products-services search:", error);
    return NextResponse.json(
      { error: "Error al buscar productos y servicios" },
      { status: 500 },
    );
  }
}
