import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Test database connection with a simple query
    await db.execute(sql`SELECT 1`);
    
    // Get connection count (PostgreSQL specific)
    const connectionCount = await db.execute<{
      active_connections: bigint;
    }>(sql`
      SELECT count(*) as active_connections 
      FROM pg_stat_activity 
      WHERE state = 'active'
    `);
    
    return NextResponse.json({
      status: 'healthy',
      database: 'postgresql',
      connections: Number(connectionCount.rows[0]?.active_connections || 0),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'postgresql',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
