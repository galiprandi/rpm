import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { getDailyOperations } from '@/lib/services/dashboardService';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

    if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const dateParam = searchParams.get('date');
    const date = dateParam ? new Date(dateParam) : new Date();

    const data = await getDailyOperations(date);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in daily operations API:', error);
    return NextResponse.json(
      { error: 'Error al obtener operaciones diarias' },
      { status: 500 }
    );
  }
}
