export function AdminHeader() {
  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center px-6">
        <div className="ml-auto flex items-center space-x-4">
          <div className="h-8 w-8 rounded-full bg-primary"></div>
        </div>
      </div>
    </header>
  );
}
