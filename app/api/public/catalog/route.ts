import { NextRequest, NextResponse } from 'next/server';
import { getPublicCatalog } from '@/lib/services/publicCatalogService';

// Simple in-memory rate limiter to prevent abuse.
// Note: only effective for single-instance deployments. For multi-replica
// or serverless, migrate to Upstash Redis or Vercel KV.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60; // max requests per window per IP
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }

  record.count += 1;
  return record.count <= RATE_LIMIT;
}

export async function GET(request: NextRequest) {
  // 1. Rate limit check
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor, intente de nuevo más tarde.' },
      { status: 429 },
    );
  }

  // 2. Orchestrate: fetch catalog from service and return with 10-min cache.
  // Business logic lives in lib/services/publicCatalogService.ts (AGENTS.md).
  try {
    const catalog = await getPublicCatalog();
    return NextResponse.json(catalog, {
      headers: {
        'Cache-Control':
          'public, max-age=600, s-maxage=600, stale-while-revalidate=59',
      },
    });
  } catch (error) {
    console.error('Error serving public catalog:', error);
    return NextResponse.json(
      { error: 'Error al obtener el catálogo público.' },
      { status: 500 },
    );
  }
}
