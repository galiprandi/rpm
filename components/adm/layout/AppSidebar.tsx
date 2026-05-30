'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const userRole = (user.role?.toUpperCase() as UserRole) ?? UserRole.STAFF;

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4 gap-2">
        {/* Buscador global */}
        <SidebarMenu className="px-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onOpenPalette}
              tooltip="Buscar (Cmd+K)"
              className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Search className="size-4" />
              <span className="text-muted-foreground text-xs">Buscar...</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Grupos de navegación */}
        {navGroups.map((group) => {
          if (!canAccess(userRole, group.roles)) return null;

          const visibleItems = group.items.filter((item) => canAccess(userRole, item.roles));
          if (visibleItems.length === 0) return null;

          const isOpen = openGroups[group.label] ?? true;
          const GroupIcon = group.icon;

          return (
            <SidebarGroup key={group.label} className="py-0">
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex w-full items-center gap-2 px-2 py-1 text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider hover:text-sidebar-foreground transition-colors group-data-[collapsible=icon]:hidden"
              >
                <GroupIcon className="size-3.5" />
                <span>{group.label}</span>
                <span className="ml-auto text-[10px] transition-transform" style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                  ▼
                </span>
              </button>
              <SidebarGroupContent
                className="transition-all overflow-hidden group-data-[collapsible=icon]:hidden"
                style={{ maxHeight: isOpen ? '999px' : '0px', opacity: isOpen ? 1 : 0 }}
              >
                <SidebarMenu className="gap-0.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                          className="hover:bg-transparent hover:text-sidebar-foreground data-active:bg-transparent data-active:text-sidebar-foreground"
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
              {/* Icon-only mode: render flat items without group label */}
              <SidebarMenu className="gap-0.5 hidden group-data-[collapsible=icon]:flex">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className="hover:bg-transparent hover:text-sidebar-foreground data-active:bg-transparent data-active:text-sidebar-foreground"
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

