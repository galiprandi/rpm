/**
 * API Route: /api/roles
 * Métodos: GET
 * Spec: /specs/users.md
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';

export interface RoleOption {
  value: string;
  label: string;
  description: string;
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
}

const ROLES_CONFIG: RoleOption[] = [
  {
    value: 'ADMIN',
    label: 'Administrador',
    description: 'Acceso completo al sistema. Gestiona usuarios, configuración y todos los módulos.',
    badgeVariant: 'default',
  },
  {
    value: 'SELLER',
    label: 'Vendedor',
    description: 'Gestiona ventas, cotizaciones y clientes. Acceso limitado a módulo de ventas.',
    badgeVariant: 'secondary',
  },
  {
    value: 'TECHNICIAN',
    label: 'Técnico',
    description: 'Acceso a órdenes de trabajo, instalaciones y tareas técnicas.',
    badgeVariant: 'outline',
  },
  {
    value: 'CASHIER',
    label: 'Cajero',
    description: 'Gestiona cobros, caja diaria y movimientos de tesorería.',
    badgeVariant: 'outline',
  },
  {
    value: 'USER',
    label: 'Usuario',
    description: 'Cliente final. Solo acceso a web pública, sin acceso a /adm.',
    badgeVariant: 'secondary',
  },
];

// GET /api/roles - Obtener roles disponibles
export async function GET() {
  try {
    const session = await getSession();

    // Require authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can see all roles (including ADMIN)
    // STAFF only sees staff roles (not ADMIN)
    const isAdmin = session.user.role === UserRole.ADMIN;

    const availableRoles = isAdmin
      ? ROLES_CONFIG
      : ROLES_CONFIG.filter((r) => r.value !== 'ADMIN');

    return NextResponse.json({ roles: availableRoles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Error al obtener roles' },
      { status: 500 }
    );
  }
}
