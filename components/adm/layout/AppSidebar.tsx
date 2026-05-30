'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LogOut,
  ChevronsUpDown,
  PanelLeft,
  PanelRight,
  Search,
  ChevronRight,
  Pin,
  PinOff,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
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
import { navGroups, homeNavItem } from '@/lib/nav/navConfig';
import { canAccess } from '@/lib/nav/canAccess';
import { usePinnedNav } from '@/hooks/usePinnedNav';
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

/** Resolve the active group label based on the current pathname */
function getActiveGroupLabel(path: string): string | undefined {
  return navGroups.find((g) =>
    g.items.some((i) => {
      if (i.href === '/adm') return path === '/adm';
      return path === i.href || path.startsWith(i.href + '/');
    })
  )?.label;
}

export function AppSidebar({ user, onSignOut, onOpenPalette }: AppSidebarProps) {
  const pathname = usePathname();
  const { isMobile, toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { isPinned, togglePin } = usePinnedNav();

  const userRole = (user.role?.toUpperCase() as UserRole) ?? UserRole.STAFF;

  // Acordeón auto-activo: solo la sección del módulo actual está abierta al navegar
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const active = getActiveGroupLabel(pathname);
    if (active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOverrides({ [active]: true });
    }
  }, [pathname]);
  const isGroupOpen = (label: string) => overrides[label] ?? false;
  const toggleGroup = (label: string) =>
    setOverrides((p) => ({ ...p, [label]: !p[label] }));

  // Flatten nav items from groups (home is handled standalone)
  const allItems = navGroups.flatMap((g) => g.items);
  const pinnedItems = allItems.filter(
    (i) => isPinned(i.href) && canAccess(userRole, i.roles)
  );

  const renderItem = (item: (typeof allItems)[number], showPin = true) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    const pinned = isPinned(item.href);
    return (
      <SidebarMenuItem key={item.href} className="group/item">
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
        {showPin && (
          <SidebarMenuAction
            showOnHover
            onClick={() => togglePin(item.href)}
            aria-label={pinned ? 'Desanclar' : 'Anclar'}
            className="text-muted-foreground hover:text-sidebar-foreground"
          >
            {pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
          </SidebarMenuAction>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-3">
        {/* Buscador global */}
        <SidebarMenu className="px-2 pb-2 mb-2 border-b border-sidebar-border">
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

        {/* Dashboard standalone (no acordeón, no pin) */}
        {canAccess(userRole, homeNavItem.roles) && (
          <SidebarMenu className="px-2 mb-3">
            {renderItem(homeNavItem, false)}
          </SidebarMenu>
        )}

        {/* Anclados */}
        {pinnedItems.length > 0 && (
          <SidebarGroup className="py-1 mb-2">
            <SidebarGroupLabel className="text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-wider">
              Anclados
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{pinnedItems.map((i) => renderItem(i))}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Acordeón por sección */}
        {navGroups.map((group) => {
          if (!canAccess(userRole, group.roles)) return null;
          const visibleItems = group.items.filter((i) => canAccess(userRole, i.roles));
          if (visibleItems.length === 0) return null;

          const open = isGroupOpen(group.label);

          return (
            <SidebarGroup key={group.label} className="py-1">
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex w-full items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-wider hover:text-sidebar-foreground transition-colors group-data-[collapsible=icon]:hidden"
              >
                <ChevronRight className={`size-3 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
                <span>{group.label}</span>
              </button>
              {/* Animated collapse */}
              <div
                className="overflow-hidden transition-all duration-200 ease-out group-data-[collapsible=icon]:opacity-100 group-data-[collapsible=icon]:max-h-[500px]"
                style={{ maxHeight: open ? '500px' : '0px', opacity: open ? 1 : 0 }}
              >
                <SidebarGroupContent>
                  <SidebarMenu>{visibleItems.map((i) => renderItem(i))}</SidebarMenu>
                </SidebarGroupContent>
              </div>
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
