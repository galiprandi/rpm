import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppSidebar } from "./AppSidebar";
import React from "react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/adm",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock hooks
vi.mock("@/hooks/useNovedadesRead", () => ({
  useNovedadesRead: () => ({
    hasUnread: false,
    markAsRead: vi.fn(),
    checkUnread: vi.fn(),
  }),
}));

vi.mock("@/hooks/usePinnedNav", () => ({
  usePinnedNav: () => ({
    pinned: [],
    isPinned: () => false,
    togglePin: vi.fn(),
    loaded: true,
  }),
}));

// Mock Lucide icons or make sure they don't break
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
  };
});

// Mock Radix tooltip to render children inline
vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Sidebar subcomponents
vi.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children }: any) => <div data-testid="sidebar">{children}</div>,
  SidebarContent: ({ children }: any) => <div>{children}</div>,
  SidebarFooter: ({ children }: any) => <div>{children}</div>,
  SidebarMenu: ({ children }: any) => <div>{children}</div>,
  SidebarMenuItem: ({ children, className }: any) => <div className={className}>{children}</div>,
  SidebarMenuButton: ({ children, onClick, className, asChild, isActive, tooltip, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
  SidebarMenuAction: ({ children }: any) => <div>{children}</div>,
  SidebarRail: () => null,
  SidebarGroup: ({ children }: any) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: any) => <div>{children}</div>,
  useSidebar: () => ({
    isMobile: false,
    state: "expanded",
    toggleSidebar: vi.fn(),
  }),
}));

const mockUser = {
  id: "user-1",
  name: "Jane Doe",
  email: "jane@example.com",
  role: "ADMIN",
};

describe("AppSidebar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render 'Preguntar a Nitro' button when onOpenChat is not provided", () => {
    render(<AppSidebar user={mockUser} onSignOut={vi.fn()} />);
    expect(screen.queryByText("Preguntar a Nitro")).not.toBeInTheDocument();
  });

  it("renders 'Preguntar a Nitro' button when onOpenChat is provided", () => {
    render(<AppSidebar user={mockUser} onSignOut={vi.fn()} onOpenChat={vi.fn()} />);
    expect(screen.getByText("Preguntar a Nitro")).toBeInTheDocument();
  });

  it("calls onOpenChat when clicking the 'Preguntar a Nitro' button", () => {
    const handleOpenChat = vi.fn();
    render(<AppSidebar user={mockUser} onSignOut={vi.fn()} onOpenChat={handleOpenChat} />);

    const nitroBtn = screen.getByText("Preguntar a Nitro");
    fireEvent.click(nitroBtn);
    expect(handleOpenChat).toHaveBeenCalledTimes(1);
  });
});
