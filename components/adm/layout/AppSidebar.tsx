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
  Sparkles,
  ShieldCheck,
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
import { cn } from '@/lib/utils';

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
  const roleLabel = userRole === UserRole.ADMIN ? 'Admin' : 'Staff';

  // Keep the current module expanded after navigation.
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
    const isActive = item.href === '/adm'
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;
    const pinned = isPinned(item.href);
    return (
      <SidebarMenuItem key={item.href} className="group/item px-1">
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={item.label}
          className={cn(
            "relative h-10 gap-3 rounded-lg px-3 text-sidebar-foreground/78 transition-[background,color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-sidebar-accent/80 hover:text-sidebar-foreground hover:shadow-sm",
            "data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:font-semibold data-active:shadow-[inset_3px_0_0_hsl(var(--sidebar-ring)),0_8px_22px_hsl(var(--sidebar-ring)/0.12)]",
            "group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:data-active:shadow-[inset_0_-3px_0_0_hsl(var(--sidebar-ring))]",
          )}
        >
          <Link href={item.href}>
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-foreground/5 text-sidebar-foreground/68 transition-colors",
                isActive && "bg-primary/12 text-primary"
              )}
            >
              <Icon className="size-4.5" />
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        </SidebarMenuButton>
        {showPin && (
          <SidebarMenuAction
            showOnHover
            onClick={() => togglePin(item.href)}
            aria-label={pinned ? 'Desanclar' : 'Anclar'}
            className="right-2 text-sidebar-foreground/45 hover:bg-primary/10 hover:text-primary"
          >
            {pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
          </SidebarMenuAction>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border/70">
      <SidebarContent className="bg-[linear-gradient(180deg,hsl(var(--sidebar))_0%,hsl(var(--sidebar-accent)/0.34)_100%)] pt-3">
        <div className="px-3 pb-4 group-data-[collapsible=icon]:px-2">
          <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-sidebar-foreground/[0.035] p-2.5 shadow-sm group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_10px_24px_hsl(var(--primary)/0.18)]">
              <Sparkles className="size-5" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
                RPM Accesorios
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-sidebar-foreground/60">
                <span className="size-1.5 rounded-full bg-primary" />
                <span>Panel operativo</span>
              </div>
            </div>
          </div>
        </div>

        <SidebarMenu className="px-3 pb-3 group-data-[collapsible=icon]:px-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onOpenPalette}
              tooltip="Buscar (⌘K)"
              className="h-11 rounded-lg border border-sidebar-border/70 bg-background/55 px-3 text-sidebar-foreground/68 shadow-sm transition-[background,color,box-shadow] hover:bg-sidebar-accent hover:text-sidebar-foreground hover:shadow-md group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
            >
              <Search className="size-4.5" />
              <span className="text-sm font-medium">Buscar módulo...</span>
              <kbd className="ml-auto rounded-md border border-sidebar-border bg-sidebar-foreground/5 px-1.5 py-0.5 text-[10px] font-mono text-sidebar-foreground/58 group-data-[collapsible=icon]:hidden">⌘K</kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {canAccess(userRole, homeNavItem.roles) && (
          <SidebarMenu className="mb-3 px-2">
            {renderItem(homeNavItem, false)}
          </SidebarMenu>
        )}

        {pinnedItems.length > 0 && (
          <SidebarGroup className="mb-2 px-2 py-1">
            <div className="mb-1 flex h-7 items-center gap-2 px-3 text-[11px] font-semibold uppercase text-sidebar-foreground/52 group-data-[collapsible=icon]:hidden">
              <Pin className="size-3.5 text-primary" />
              <span>Anclados</span>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>{pinnedItems.map((i) => renderItem(i))}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Section accordion */}
        {navGroups.map((group) => {
          if (!canAccess(userRole, group.roles)) return null;
          const visibleItems = group.items.filter((i) => canAccess(userRole, i.roles));
          if (visibleItems.length === 0) return null;

          const open = isGroupOpen(group.label);
          const GroupIcon = group.icon;

          return (
            <SidebarGroup key={group.label} className="px-2 py-1">
              <button
                onClick={() => toggleGroup(group.label)}
                className="mb-1 flex h-8 w-full items-center gap-2 rounded-lg px-3 text-[11px] font-semibold uppercase text-sidebar-foreground/54 transition-colors hover:bg-sidebar-accent/55 hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
                aria-expanded={open}
              >
                <GroupIcon className="size-3.5 text-sidebar-foreground/42" />
                <span className="flex-1 text-left">{group.label}</span>
                <span className="rounded-full bg-sidebar-foreground/8 px-1.5 py-0.5 text-[10px] text-sidebar-foreground/50">
                  {visibleItems.length}
                </span>
                <ChevronRight className={`size-3.5 transition-transform duration-200 ${open ? 'rotate-90 text-primary' : ''}`} />
              </button>
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

      <SidebarFooter className="gap-2 border-t border-sidebar-border/70 bg-sidebar/92 pb-4 pt-3">
        <div className="px-2 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 rounded-lg border border-sidebar-border/70 bg-sidebar-foreground/[0.035] px-3 py-2 text-xs text-sidebar-foreground/65">
            <ShieldCheck className="size-4 text-primary" />
            <span className="truncate">Sesión segura</span>
            <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {roleLabel}
            </span>
          </div>
        </div>

        <SidebarMenu className="px-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleSidebar}
              tooltip={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
              className="h-9 rounded-lg text-sidebar-foreground/62 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
        <SidebarMenu className="px-2">
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="h-13 rounded-xl border border-sidebar-border/70 bg-sidebar-foreground/[0.035] px-2.5 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <Avatar className="h-9 w-9 rounded-lg ring-1 ring-sidebar-border">
                    <AvatarImage src={user.image || undefined} alt={user.name} />
                    <AvatarFallback className="rounded-lg bg-primary/12 text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-sidebar-foreground/55">{user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/45 group-data-[collapsible=icon]:hidden" />
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
