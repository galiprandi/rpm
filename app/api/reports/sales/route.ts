import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { getSalesReport } from '@/lib/services/reportService';
import { getArgentinaStartOfDay, getArgentinaEndOfDay } from '@/lib/utils/date';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startStr = searchParams.get('startDate');
    const endStr = searchParams.get('endDate');
    const compStartStr = searchParams.get('comparisonStartDate');
    const compEndStr = searchParams.get('comparisonEndDate');

    if (!startStr || !endStr) {
      return NextResponse.json({ error: 'Faltan fechas de inicio y fin' }, { status: 400 });
    }

    const startDate = getArgentinaStartOfDay(new Date(startStr));
    const endDate = getArgentinaEndOfDay(new Date(endStr));

    let comparisonStartDate;
    let comparisonEndDate;

    if (compStartStr && compEndStr) {
      comparisonStartDate = getArgentinaStartOfDay(new Date(compStartStr));
      comparisonEndDate = getArgentinaEndOfDay(new Date(compEndStr));
    }

    const report = await getSalesReport({
      startDate,
      endDate,
      comparisonStartDate,
      comparisonEndDate,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error in reports/sales API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
