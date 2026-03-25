export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">
          Panel de administración de RPM Accesorios
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Dashboard cards placeholder - will be implemented in components.md */}
        <div className="bg-card rounded-lg border p-6">
          <div className="text-2xl font-bold text-foreground">0</div>
          <p className="text-sm text-muted-foreground">Productos</p>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <div className="text-2xl font-bold text-foreground">0</div>
          <p className="text-sm text-muted-foreground">Usuarios</p>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <div className="text-2xl font-bold text-foreground">0</div>
          <p className="text-sm text-muted-foreground">Pedidos</p>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <div className="text-2xl font-bold text-foreground">$0</div>
          <p className="text-sm text-muted-foreground">Ingresos</p>
        </div>
      </div>
      
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
        <p className="text-muted-foreground">
          No hay actividad reciente. El sistema está en configuración inicial.
        </p>
      </div>
    </div>
  );
}
