'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Folder,
  Truck,
  Users,
  Settings,
  LogOut,
  ChevronsUpDown,
  PanelLeft,
  PanelRight,
  UserCircle,
  ClipboardList,
  Handshake,
  CircleDollarSign,
  Wallet,
  TrendingDown,
  Newspaper,
} from 'lucide-react';
import { useNovedadesRead } from '@/hooks/useNovedadesRead';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigation = [
  { name: 'Dashboard', href: '/adm', icon: LayoutDashboard },
  { name: 'Clientes', href: '/adm/customers', icon: UserCircle },
  { name: 'Órdenes de Trabajo', href: '/adm/work-orders', icon: ClipboardList },
  { name: 'Productos', href: '/adm/products', icon: Package },
  { name: 'Servicios', href: '/adm/services', icon: Handshake },
  { name: 'Categorías', href: '/adm/categories', icon: Folder },
  { name: 'Precios', href: '/adm/price-lists', icon: CircleDollarSign },
  { name: 'Arqueo de Caja', href: '/adm/cash', icon: Wallet },
  { name: 'Deudores', href: '/adm/reports/debtors', icon: TrendingDown },
  { name: 'Proveedores', href: '/adm/suppliers', icon: Truck },
  { name: 'Usuarios', href: '/adm/users', icon: Users },
];

interface AppSidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string;
  };
  onSignOut: () => void;
}

export function AppSidebar({ user, onSignOut }: AppSidebarProps) {
  const pathname = usePathname();
  const { isMobile, toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { hasUnread } = useNovedadesRead();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        <SidebarMenu className="gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.name}
                  className="hover:bg-transparent hover:text-sidebar-foreground data-active:bg-transparent data-active:text-sidebar-foreground"
                >
                  <Link href={item.href}>
                    <Icon className="size-5" />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="pb-4 gap-2">
        {/* Toggle first */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleSidebar}
              tooltip={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
              className="hover:bg-transparent hover:text-sidebar-foreground"
            >
              {isCollapsed ? (
                <PanelRight className="size-5" />
              ) : (
                <PanelLeft className="size-5" />
              )}
              <span>{isCollapsed ? 'Expandir' : 'Colapsar'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* Novedades second */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/adm/novedades'}
              tooltip="Novedades"
              className="hover:bg-transparent hover:text-sidebar-foreground data-active:bg-transparent data-active:text-sidebar-foreground"
            >
              <Link href="/adm/novedades">
                <Newspaper className={`size-5 ${hasUnread ? 'text-yellow-500 animate-pulse' : 'text-muted-foreground'}`} />
                <span>Novedades</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* Settings third */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/adm/settings'}
              tooltip="Configuración"
              className="hover:bg-transparent hover:text-sidebar-foreground data-active:bg-transparent data-active:text-sidebar-foreground"
            >
              <Link href="/adm/settings">
                <Settings className="size-5" />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* Avatar last */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-transparent data-[state=open]:text-sidebar-foreground hover:bg-transparent hover:text-sidebar-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.image || undefined} alt={user.name} />
                    <AvatarFallback className="rounded-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-5 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user.image || undefined} alt={user.name} />
                      <AvatarFallback className="rounded-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOut className="size-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
