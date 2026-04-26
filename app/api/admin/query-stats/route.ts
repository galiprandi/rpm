/**
 * GET /api/admin/query-stats
 * Returns Prisma query statistics for performance analysis
 * Requires ADMIN role
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';

// Simple in-memory stats (resets on deployment)
const queryStats = {
  totalQueries: 0,
  byModel: {} as Record<string, number>,
  byOperation: {} as Record<string, number>,
  lastReset: new Date().toISOString(),
};

// Track queries via Prisma's query event
if (process.env.PRISMA_PERF_LOG === 'true') {
  // @ts-expect-error - Prisma internal event
  prisma.$on('query', (e: { query: string; duration: number; params: string }) => {
    queryStats.totalQueries++;

    // Parse model from query
    const modelMatch = e.query.match(/FROM "?(\w+)"?/i) || e.query.match(/"?(\w+)"?\.(create|find|update|delete|upsert)/i);
    const model = modelMatch ? modelMatch[1] : 'unknown';

    // Parse operation
    const opMatch = e.query.match(/^(SELECT|INSERT|UPDATE|DELETE)/i) ||
                    e.query.match(/\.(findMany|findUnique|create|update|deleteMany|upsert|aggregate|count)/i);
    const operation = opMatch ? opMatch[1] : 'unknown';

    queryStats.byModel[model] = (queryStats.byModel[model] || 0) + 1;
    queryStats.byOperation[operation] = (queryStats.byOperation[operation] || 0) + 1;

    // Log slow queries (>100ms)
    if (e.duration > 100) {
      console.warn(`[SLOW QUERY] ${model}.${operation}: ${e.duration}ms`);
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withAdmin(async (_request: NextRequest, _session) => {
  // Get current connection count estimate
  const activeConnections = await prisma.$queryRaw<{ count: number }[]>`
    SELECT count(*) as count FROM pg_stat_activity WHERE datname = current_database()
  `;

  return NextResponse.json({
    stats: queryStats,
    connections: activeConnections[0]?.count || 0,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Reset stats
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const POST = withAdmin(async (_request: NextRequest, _session) => {
  queryStats.totalQueries = 0;
  queryStats.byModel = {};
  queryStats.byOperation = {};
  queryStats.lastReset = new Date().toISOString();

  return NextResponse.json({ success: true, message: 'Stats reset' });
});
