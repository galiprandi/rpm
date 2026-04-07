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

// GET /api/dashboard/summary
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

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

    // Obtener datos del dashboard usando el servicio compartido
    const data = await getDashboardData();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en dashboard summary:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
