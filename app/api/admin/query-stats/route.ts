/**
 * GET /api/admin/query-stats
 * Returns database query statistics for performance analysis
 * Requires ADMIN role
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// Simple in-memory stats (resets on deployment)
// Note: Drizzle does not expose a query event hook for query timing.
// Query stats tracking is not available with the Drizzle client.
const queryStats = {
  totalQueries: 0,
  byModel: {} as Record<string, number>,
  byOperation: {} as Record<string, number>,
  lastReset: new Date().toISOString(),
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withAdmin(async (_request: NextRequest, _session) => {
  // Get current connection count estimate
  const activeConnections = await db.execute<{
    count: number;
  }>(sql`SELECT count(*) as count FROM pg_stat_activity WHERE datname = current_database()`);

  return NextResponse.json({
    stats: queryStats,
    connections: Number(activeConnections.rows[0]?.count) || 0,
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
