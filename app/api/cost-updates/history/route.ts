/**
 * API Route: /api/cost-updates/history
 * GET: Get history of cost update batches
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { getCostUpdateHistory } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Pagination params
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 20));

    // Get history
    const result = await getCostUpdateHistory(page, pageSize);

    return NextResponse.json({
      ...result,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    });
  } catch (error) {
    console.error('Cost update history error:', error);
    const message = error instanceof Error ? error.message : 'Error fetching history';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
