'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  ChevronsUpDown,
  PanelLeft,
  PanelRight,
  Search,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
import { navGroups } from '@/lib/nav/navConfig';
import { canAccess } from '@/lib/nav/canAccess';
import { UserRole } from '@/lib/auth/roles';

interface AppSidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string;
  };
  onSignOut: () => void;
  onOpenPalette?: () => void;
}

export function AppSidebar({ user, onSignOut, onOpenPalette }: AppSidebarProps) {
  const pathname = usePathname();
  const { isMobile, toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const userRole = (user.role?.toUpperCase() as UserRole) ?? UserRole.STAFF;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-3">
        {/* Buscador global */}
        <SidebarMenu className="px-2 mb-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onOpenPalette}
              tooltip="Buscar (⌘K)"
              className="text-muted-foreground border border-sidebar-border bg-sidebar-accent/30 hover:bg-sidebar-accent"
            >
              <Search className="size-4" />
              <span className="text-xs">Buscar...</span>
              <kbd className="ml-auto text-[10px] font-mono opacity-60 group-data-[collapsible=icon]:hidden">⌘K</kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Grupos de navegación con labels de sección sutiles */}
        {navGroups.map((group) => {
          if (!canAccess(userRole, group.roles)) return null;

          const visibleItems = group.items.filter((item) => canAccess(userRole, item.roles));
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="py-1">
              <SidebarGroupLabel className="text-[10px] font-medium text-sidebar-foreground/40 uppercase tracking-wider">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                          className="hover:bg-sidebar-accent data-active:bg-sidebar-accent data-active:font-medium"
                        >
                          <Link href={item.href}>
                            <Icon className="size-5" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="pb-4 gap-2">
        {/* Toggle */}
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
        {/* Avatar */}
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

