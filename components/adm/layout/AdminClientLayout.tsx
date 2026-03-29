'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { AdminSidebar } from './AdminSidebar';
import { UIProvider } from '@/components/ui/UIProvider';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/login';
  };

  return (
    <UIProvider>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar colapsable */}
        <aside 
          className={`bg-card border-r transition-all duration-300 ${
            isSidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
              {!isSidebarCollapsed && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Admin
                  </h2>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.name}
                  </p>
                </div>
              )}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 rounded-md hover:bg-accent transition-colors"
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  {isSidebarCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  )}
                </svg>
              </button>
            </div>
            
            <div className="flex-1 flex flex-col pt-4">
              <AdminSidebar onSignOut={handleSignOut} collapsed={isSidebarCollapsed} />
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </UIProvider>
  );
}
