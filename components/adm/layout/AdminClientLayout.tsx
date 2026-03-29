'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { AppSidebar } from './AppSidebar';
import { useUI } from '@/components/ui/UIProvider';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';

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
  const { confirm } = useUI();
  const [mounted, setMounted] = useState(false);
  const [defaultOpen] = useState<boolean>(() => {
    if (typeof document === 'undefined') return true;
    const match = document.cookie.match(/sidebar_state=([^;]+)/);
    return match ? match[1] === 'true' : true;
  });

  useEffect(() => {
    // Set mounted state after component mounts to avoid hydration mismatch
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = async () => {
    const confirmed = await confirm({
      title: 'Cerrar sesión',
      description: `¿Está seguro de cerrar la sesión del usuario "${user.name}"?`,
      confirmText: 'Cerrar sesión',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });

    if (confirmed) {
      await authClient.signOut();
      window.location.href = '/login';
    }
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
          <AppSidebar user={user} onSignOut={handleSignOut} />
          <SidebarInset>
            <main className="flex-1 p-6">
              <div className="md:hidden flex items-center -mt-4 -mx-2 mb-2">
                <SidebarTrigger />
              </div>
              {children}
            </main>
          </SidebarInset>
        </>
      )}
    </SidebarProvider>
  );
}
