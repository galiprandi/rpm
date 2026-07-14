"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { AppSidebar } from "./AppSidebar";
import { CommandPalette } from "@/components/adm/CommandPalette";
import { ChatFloating } from "@/components/bot/ChatFloating";
import { WebMCPTools } from "@/components/webmcp/WebMCPTools";
import { WebMCPNavTools } from "@/components/webmcp/WebMCPNavTools";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface AdminClientLayoutProps {
  children: React.ReactNode;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string;
  };
}

export function AdminClientLayout({ children, user }: AdminClientLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [defaultOpen] = useState<boolean>(() => {
    if (typeof document === "undefined") return true;
    const match = document.cookie.match(/sidebar_state=([^;]+)/);
    return match ? match[1] === "true" : true;
  });

  useEffect(() => {
    // Set mounted state after component mounts to avoid hydration mismatch
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Global Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/login";
  };

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {!mounted ? (
        <div className="min-h-screen bg-background">
          <div className="flex">
            <aside className="w-64 bg-sidebar h-screen" />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      ) : (
        <>
          <AppSidebar
            user={user}
            onSignOut={handleSignOut}
            onOpenPalette={() => setPaletteOpen(true)}
          />
          <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
          <SidebarInset>
            <main className="flex-1 p-6">
              <div className="md:hidden flex items-center -mt-4 -mx-2 mb-2">
                <SidebarTrigger />
              </div>
              {children}
            </main>
          </SidebarInset>
          <ChatFloating isOpen={chatOpen} onOpenChange={setChatOpen} />
          <WebMCPTools />
          <WebMCPNavTools />
        </>
      )}
    </SidebarProvider>
  );
}
