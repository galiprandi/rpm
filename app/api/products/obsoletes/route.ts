/**
 * API Route: /api/products/obsoletes
 * GET: Listar productos obsoletos (stock crítico sin movimientos 90 días)
 * Spec: /specs/inventory-sales.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { getObsoleteProducts } from '@/lib/services/productService';
import { auth } from '@/lib/auth';

// GET /api/products/obsoletes
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // TODO: Check if user is ADMIN (optional for now)
    // const userRole = await getUserRole(session.user.email);
    // if (userRole !== UserRole.ADMIN) {
    //   return NextResponse.json(
    //     { error: 'Solo administradores pueden ver productos obsoletos' },
    //     { status: 403 }
    //   );
    // }

    const products = await getObsoleteProducts();

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching obsolete products:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos obsoletos' },
      { status: 500 }
    );
  }
}
