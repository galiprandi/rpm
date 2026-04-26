/**
 * API Route: /api/dashboard/summary
 * Métodos: GET
 * Spec: /specs/spec-admin-dashboard.md
 * 
 * Retorna un resumen del dashboard con métricas de ventas, OTs, stock y movimientos
 * 
 * Esta API route usa el servicio compartido getDashboardData() para obtener los datos,
 * lo que permite reutilizar la lógica en Server Components y AI Agents.
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { getDashboardData } from '@/lib/services/dashboardService';
import { unstable_cache } from 'next/cache';

// GET /api/dashboard/summary
// Cache for 60 seconds to reduce database operations
export const revalidate = 60;

export async function GET() {
  try {
    // Validar sesión y rol
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si tiene rol STAFF o ADMIN
    const userRole = session.user.role;
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener datos del dashboard con cache
    const getCachedDashboardData = unstable_cache(
      getDashboardData,
      ['dashboard-api'],
      { revalidate: 60 }
    );
    const data = await getCachedDashboardData();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en dashboard summary:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
