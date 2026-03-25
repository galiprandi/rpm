export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">
            RPM Admin
          </h2>
          <p className="mt-2 text-muted-foreground">
            Inicia sesión para acceder al panel de administración
          </p>
        </div>
        
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              El sistema de autenticación estará disponible próximamente.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Se implementará con Google OAuth según la especificación.
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Área de administración - RPM Accesorios
          </p>
        </div>
      </div>
    </div>
  );
}
