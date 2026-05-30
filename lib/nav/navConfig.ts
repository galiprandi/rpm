import {
  LayoutDashboard,
  UserCircle,
  ClipboardList,
  Package,
  Handshake,
  Folder,
  CircleDollarSign,
  Wallet,
  TrendingDown,
  Truck,
  Users,
  FileText,
  Receipt,
  BarChart3,
  Newspaper,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { UserRole } from '@/lib/auth/roles';

/** Un ítem navegable en el sidebar */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

/** Un grupo de navegación colapsable */
export interface NavGroup {
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  items: NavItem[];
}

/** Todas las rutas de administración definidas en un solo lugar */
export const navGroups: NavGroup[] = [
  {
    label: 'Inicio',
    icon: LayoutDashboard,
    roles: [UserRole.ADMIN, UserRole.STAFF],
    items: [
      { label: 'Dashboard', href: '/adm', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.STAFF] },
    ],
  },
  {
    label: 'Taller',
    icon: ClipboardList,
    roles: [UserRole.ADMIN, UserRole.STAFF],
    items: [
      { label: 'Órdenes de Trabajo', href: '/adm/work-orders', icon: ClipboardList, roles: [UserRole.ADMIN, UserRole.STAFF] },
      { label: 'Clientes', href: '/adm/customers', icon: UserCircle, roles: [UserRole.ADMIN, UserRole.STAFF] },
    ],
  },
  {
    label: 'Catálogo',
    icon: Package,
    roles: [UserRole.ADMIN, UserRole.STAFF],
    items: [
      { label: 'Productos', href: '/adm/products', icon: Package, roles: [UserRole.ADMIN, UserRole.STAFF] },
      { label: 'Servicios', href: '/adm/services', icon: Handshake, roles: [UserRole.ADMIN, UserRole.STAFF] },
      { label: 'Categorías', href: '/adm/categories', icon: Folder, roles: [UserRole.ADMIN, UserRole.STAFF] },
      { label: 'Precios', href: '/adm/price-lists', icon: CircleDollarSign, roles: [UserRole.ADMIN, UserRole.STAFF] },
    ],
  },
  {
    label: 'Finanzas',
    icon: Wallet,
    roles: [UserRole.ADMIN, UserRole.STAFF],
    items: [
      { label: 'Arqueo de Caja', href: '/adm/cash', icon: Wallet, roles: [UserRole.ADMIN, UserRole.STAFF] },
      { label: 'Operaciones', href: '/adm/operations', icon: BarChart3, roles: [UserRole.ADMIN, UserRole.STAFF] },
      { label: 'Deudores', href: '/adm/reports/debtors', icon: TrendingDown, roles: [UserRole.ADMIN, UserRole.STAFF] },
      { label: 'Notas de Crédito', href: '/adm/credit-notes', icon: FileText, roles: [UserRole.ADMIN, UserRole.STAFF] },
      { label: 'Comprobantes', href: '/adm/purchase-vouchers', icon: Receipt, roles: [UserRole.ADMIN, UserRole.STAFF] },
    ],
  },
  {
    label: 'Compras',
    icon: Truck,
    roles: [UserRole.ADMIN, UserRole.STAFF],
    items: [
      { label: 'Proveedores', href: '/adm/suppliers', icon: Truck, roles: [UserRole.ADMIN, UserRole.STAFF] },
    ],
  },
  {
    label: 'Administración',
    icon: Settings,
    roles: [UserRole.ADMIN],
    items: [
      { label: 'Usuarios', href: '/adm/users', icon: Users, roles: [UserRole.ADMIN] },
      { label: 'Configuración', href: '/adm/settings', icon: Settings, roles: [UserRole.ADMIN] },
      { label: 'Novedades', href: '/adm/novedades', icon: Newspaper, roles: [UserRole.ADMIN, UserRole.STAFF] },
    ],
  },
];

/** Ítems planos para la Command Palette */
export const flatNavItems: { label: string; href: string; group: string }[] =
  navGroups.flatMap((g) => g.items.map((i) => ({ label: i.label, href: i.href, group: g.label })));
