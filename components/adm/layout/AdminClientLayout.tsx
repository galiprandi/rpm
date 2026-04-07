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
import { ChatFloating } from '@/components/bot/ChatFloating';

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
  const [chatOpen, setChatOpen] = useState(false);
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

  // Initialize debug helpers in development
  useEffect(() => {
    // Solo inicializar en desarrollo
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_AUTH_ENABLED === 'true') {
      console.log('🔐 Inicializando Debug Auth Helper...');
      
      // Función simple para cambiar de usuario
      const switchUser = async (role: 'admin' | 'staff' | 'user'): Promise<void> => {
        try {
          console.log(`🔄 Cambiando a ${role.toUpperCase()}...`);
          
          const response = await fetch('/api/auth/debug', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: role.toUpperCase() })
          });

          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }

          const result = await response.json();
          console.log('✅ Usuario cambiado:', result.user.name);
          
          // Recargar la página
          location.reload();
          
        } catch (error) {
          console.error('❌ Error al cambiar usuario:', error);
        }
      };

      // Función para mostrar ayuda
      const showHelp = (): void => {
        console.log(`
🔐 Debug Auth Helper - Comandos rápidos:

💥 Si te redirigen a /login:
   → await switchUser('admin')

🔍 Cambiar de rol:
   → await switchUser('admin')   // Acceso total
   → await switchUser('staff')    // Acceso limitado
   → await switchUser('user')     // Solo público

📋 Ver usuario actual:
   → await fetch('/api/auth/debug').then(r => r.json()).then(console.log)

⚡ El más útil: await switchUser('admin')
        `);
      };

      // Asignar a window
      (window as any).switchUser = switchUser;
      (window as any).showDebugHelp = showHelp;
      
      // Mostrar ayuda
      console.log('🔐 Debug Auth Helper cargado. Ejecuta showDebugHelp() para ver ayuda.');
      showHelp();
    }
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
          <AppSidebar user={user} onSignOut={handleSignOut} onOpenChat={() => setChatOpen(true)} />
          <SidebarInset>
            <main className="flex-1 p-6">
              <div className="md:hidden flex items-center -mt-4 -mx-2 mb-2">
                <SidebarTrigger />
              </div>
              {children}
            </main>
          </SidebarInset>
          <ChatFloating isOpen={chatOpen} onOpenChange={setChatOpen} />
        </>
      )}
    </SidebarProvider>
  );
}
