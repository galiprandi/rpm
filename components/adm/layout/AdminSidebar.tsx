import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Package, 
  Folder,
  Truck,
  Users, 
  Settings,
  LogOut,
  UserCircle,
  Wrench,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/adm', icon: LayoutDashboard },
  { name: 'Productos', href: '/adm/products', icon: Package },
  { name: 'Categorías', href: '/adm/categories', icon: Folder },
  { name: 'Proveedores', href: '/adm/suppliers', icon: Truck },
  { name: 'Clientes', href: '/adm/customers', icon: UserCircle },
  { name: 'Órdenes de Trabajo', href: '/adm/work-orders', icon: Wrench },
  { name: 'Usuarios', href: '/adm/users', icon: Users },
  { name: 'Configuración', href: '/adm/settings', icon: Settings },
];

export function AdminSidebar({ onSignOut, collapsed = false }: { onSignOut?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-card h-full flex flex-col transition-all duration-300`}>
      <nav className={`${collapsed ? 'px-2' : 'px-4'} space-y-2 pt-4`}>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-md text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="h-5 w-5" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
      
      {/* Logout button - fixed at bottom */}
      <div className={`mt-auto pt-4 ${collapsed ? 'px-2' : 'px-4'}`}>
        <button
          onClick={onSignOut}
          className={cn(
            'flex items-center w-full rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
            collapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'
          )}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );
}
