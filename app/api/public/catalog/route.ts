import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applyRounding } from '@/lib/utils/rounding';

// Simple in-memory rate limiter to prevent abuse
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const LIMIT = 60; // Max 60 requests per minute
const WINDOW = 60 * 1000; // 1 minute in milliseconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW });
    return true;
  }

  if (now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW });
    return true;
  }

  record.count += 1;
  return record.count <= LIMIT;
}

export async function GET(request: NextRequest) {
  // 1. Rate Limit Check
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor, intente de nuevo más tarde.' },
      { status: 429 }
    );
  }

  try {
    // 2. Fetch Public Price List and its Exceptions
    const publicPriceList = await prisma.price_list.findFirst({
      where: { isPublic: true, isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    const exceptionMap = new Map<string, { overrideMarginPercentage: any; fixedPrice: any }>();
    if (publicPriceList) {
      const exceptions = await prisma.price_list_item.findMany({
        where: { priceListId: publicPriceList.id },
        select: {
          productId: true,
          overrideMarginPercentage: true,
          fixedPrice: true
        }
      });
      for (const item of exceptions) {
        if (item.productId) {
          exceptionMap.set(item.productId, {
            overrideMarginPercentage: item.overrideMarginPercentage,
            fixedPrice: item.fixedPrice
          });
        }
      }
    }

    // 3. Fetch Active Products
    const dbProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        imageUrl: true,
        costPrice: true,
        replacementCost: true,
        category: {
          select: {
            id: true,
            name: true,
            defaultMarginPercent: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // 4. Transform Products for Public Catalog (Safe Fields only)
    const products = dbProducts.map((product) => {
      const replacementCost = product.replacementCost ? Number(product.replacementCost) : 0;
      const costPrice = product.costPrice ? Number(product.costPrice) : 0;
      const baseCost = replacementCost > 0 ? replacementCost : costPrice;

      let finalPrice = 0;
      if (publicPriceList) {
        const exc = exceptionMap.get(product.id);
        const roundingRule = (publicPriceList.roundingRule as any) || 'SMART_HUNDREDS';
        const baseMargin = Number(publicPriceList.baseMarginPercentage);

        if (exc && exc.fixedPrice !== null && exc.fixedPrice !== undefined) {
          finalPrice = Number(exc.fixedPrice);
        } else {
          const margin = exc && exc.overrideMarginPercentage !== null && exc.overrideMarginPercentage !== undefined
            ? Number(exc.overrideMarginPercentage)
            : baseMargin;
          const rawPrice = baseCost * (1 + margin / 100);
          finalPrice = applyRounding(rawPrice, roundingRule);
        }
      } else {
        const margin = product.category ? Number(product.category.defaultMarginPercent) : 40;
        const rawPrice = baseCost * (1 + margin / 100);
        finalPrice = applyRounding(rawPrice, 'SMART_HUNDREDS');
      }

      const imageFallback = product.name ? product.name.charAt(0).toUpperCase() : 'P';

      return {
        id: product.id,
        sku: product.sku || '',
        name: product.name,
        category: product.category?.name || 'Varios',
        price: finalPrice,
        image: imageFallback,
        imageUrl: product.imageUrl || null,
        description: product.description || '',
        features: [] // Specs not structured in DB, placeholder array to match template
      };
    });

    // 5. Fetch Active Categories
    const dbCategories = await prisma.category.findMany({
      where: { isActive: true },
      select: { name: true },
      orderBy: { sortOrder: 'asc' }
    });
    const categories = ['Todos', ...dbCategories.map(c => c.name)];

    // 6. Return response with 10-minute cache control
    return NextResponse.json(
      { products, categories },
      {
        headers: {
          'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=59',
        }
      }
    );
  } catch (error) {
    console.error('Error serving public catalog:', error);
    return NextResponse.json(
      { error: 'Error al obtener el catálogo público.' },
      { status: 500 }
    );
  }
}
