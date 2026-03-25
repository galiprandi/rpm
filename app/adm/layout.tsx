'use client';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar placeholder - will be implemented in components.md */}
        <div className="w-64 bg-card border-r min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-foreground">
              RPM Admin
            </h2>
          </div>
        </div>
        
        <div className="flex-1">
          {/* Header placeholder - will be implemented in components.md */}
          <header className="bg-card border-b px-6 py-4">
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </header>
          
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
