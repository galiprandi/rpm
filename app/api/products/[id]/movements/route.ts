/**
 * API Route: /api/products/[id]/movements
 * GET: Listar movimientos de stock de un producto
 * Spec: /specs/inventory-sales.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProductMovements } from '@/lib/services/productService';
import { getSession } from '@/lib/auth-server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/products/[id]/movements
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    console.log('[API] Fetching movements for product:', id);
    
    const movements = await getProductMovements(id);
    console.log('[API] Movements fetched:', movements.length);

    return NextResponse.json({ movements });
  } catch (error) {
    console.error('[API] Error fetching product movements:', error);
    console.error('[API] Error details:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Error al obtener movimientos del producto', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
