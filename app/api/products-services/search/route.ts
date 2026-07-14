/**
 * API Route: /api/products-services/search
 * Method: GET
 * Query params: q, categoryId, priceListId, limit
 * Spec: /specs/components/product-service-selector.md
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    let priceList: {
      id: string;
      baseMarginPercentage: number;
      roundingRule: RoundingRule;
    } | null = null;
    const allActivePriceLists: Array<{
      id: string;
      baseMarginPercentage: number;
      roundingRule: RoundingRule;
    }> = [];

    const lists = await prisma.price_list.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    for (const pl of lists) {
      const listData = {
        id: pl.id,
        baseMarginPercentage: Number(pl.baseMarginPercentage),
        roundingRule: pl.roundingRule as RoundingRule,
      };
      allActivePriceLists.push(listData);
      if (pl.id === priceListId) {
        priceList = listData;
      }
    }

    // Build search conditions for a field
    function buildFieldConditions(
      terms: ReturnType<typeof parseSearchQuery>,
      field: string,
    ) {
      const conditions: unknown[] = [];

      // Phrases must be present as exact substrings
      for (const phrase of terms.phrases) {
        conditions.push({ [field]: { contains: phrase, mode: "insensitive" } });
      }

      // Required terms must be present
      for (const term of terms.required) {
        conditions.push({ [field]: { contains: term, mode: "insensitive" } });
      }

      // If we have optional terms, at least one must match (but only if no required/phrases)
      if (
        terms.optional.length > 0 &&
        terms.required.length === 0 &&
        terms.phrases.length === 0
      ) {
        conditions.push({
          OR: terms.optional.map((term) => ({
            [field]: { contains: term, mode: "insensitive" },
          })),
        });
      } else if (terms.optional.length > 0) {
        // Optional terms when we have required/phrases - they just expand the match
        // but aren't mandatory
        conditions.push({
          OR: terms.optional.map((term) => ({
            [field]: { contains: term, mode: "insensitive" },
          })),
        });
      }

      return conditions;
    }

    const searchTerms = q ? parseSearchQuery(q) : null;

    // Buscar productos
    const productWhere: Record<string, unknown> = { isActive: true };

    if (searchTerms) {
      const nameConditions = buildFieldConditions(searchTerms, "name");
      const skuConditions = buildFieldConditions(searchTerms, "sku");
      const barcodeConditions = buildFieldConditions(searchTerms, "barcode");

      // Combine with OR across fields, but each field must satisfy all its conditions
      const allFieldConditions = [
        ...nameConditions,
        ...skuConditions,
        ...barcodeConditions,
      ];

      if (allFieldConditions.length > 0) {
        // If we have required terms or phrases, use AND logic
        if (searchTerms.required.length > 0 || searchTerms.phrases.length > 0) {
          // Group required conditions - all must match
          const requiredAndPhrases = [
            ...searchTerms.phrases.map((phrase) => ({
              OR: [
                { name: { contains: phrase, mode: "insensitive" } },
                { sku: { contains: phrase, mode: "insensitive" } },
                { barcode: { contains: phrase, mode: "insensitive" } },
              ],
            })),
            ...searchTerms.required.map((term) => ({
              OR: [
                { name: { contains: term, mode: "insensitive" } },
                { sku: { contains: term, mode: "insensitive" } },
                { barcode: { contains: term, mode: "insensitive" } },
              ],
            })),
          ];

          productWhere.AND = requiredAndPhrases;

          // Optional terms can match in any field (for relevance boost)
          if (searchTerms.optional.length > 0) {
            productWhere.OR = [
              {
                name: {
                  contains: searchTerms.optional.join(" "),
                  mode: "insensitive",
                },
              },
              {
                sku: {
                  contains: searchTerms.optional.join(" "),
                  mode: "insensitive",
                },
              },
              {
                barcode: {
                  contains: searchTerms.optional.join(" "),
                  mode: "insensitive",
                },
              },
            ];
          }
        } else {
          // Only optional terms - OR logic
          productWhere.OR = [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { barcode: { contains: q, mode: "insensitive" } },
          ];
        }
      }
    }

    if (categoryId) {
      productWhere.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where: productWhere,
      take: limit,
      orderBy: { name: "asc" },
      include: { category: true },
    });

    // Buscar servicios (solo si hay término de búsqueda o si no hay filtro de categoría)
    let services: Array<{
      id: string;
      name: string;
      baseCost: unknown;
      description: string | null;
    }> = [];

    if (!categoryId) {
      const serviceWhere: Record<string, unknown> = { isActive: true };

      if (searchTerms) {
        if (searchTerms.required.length > 0 || searchTerms.phrases.length > 0) {
          // Required/phrases must match in name OR description
          const requiredConditions = [
            ...searchTerms.phrases.map((phrase) => ({
              OR: [
                { name: { contains: phrase, mode: "insensitive" } },
                { description: { contains: phrase, mode: "insensitive" } },
              ],
            })),
            ...searchTerms.required.map((term) => ({
              OR: [
                { name: { contains: term, mode: "insensitive" } },
                { description: { contains: term, mode: "insensitive" } },
              ],
            })),
          ];

          serviceWhere.AND = requiredConditions;
        } else if (searchTerms.optional.length > 0) {
          // Only optional terms - match in name OR description
          serviceWhere.OR = [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ];
        }
      }

      const rawServices = await prisma.service.findMany({
        where: serviceWhere,
        take: limit,
        orderBy: { name: "asc" },
      });

      services = rawServices.map((s: any) => ({
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
      const productIds = products.map((p: any) => p.id);
      const exceptions = await prisma.price_list_item.findMany({
        where: {
          priceListId,
          productId: { in: productIds },
        },
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
      const productIds = products.map((p: any) => p.id);
      const allListIds = allActivePriceLists.map((pl) => pl.id);

      const exceptions = await prisma.price_list_item.findMany({
        where: {
          priceListId: { in: allListIds },
          productId: { in: productIds },
        },
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

      if (priceList) {
        const exception = priceExceptions.get(product.id);
        const priceInfo = calculateProductPriceForList(
          product,
          baseCost,
          priceList,
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
