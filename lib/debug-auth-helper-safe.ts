/**
 * 🔐 Non-Invasive Debug Auth Helper
 * 
 * Provides debug functionality WITHOUT overriding console.log
 * Safe for production and other logging systems
 */

declare global {
  interface Window {
    switchUser?: (role: 'admin' | 'staff' | 'user') => Promise<void>;
    showDebugHelp?: () => void;
    help?: () => void;
  }
}

export function initDebugAuthHelper(): void {
  // Only in development with debug auth enabled
  if (
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost' &&
    process.env.NODE_ENV === 'development' &&
    process.env.DEBUG_AUTH_ENABLED === 'true'
  ) {
    // Función para cambiar de usuario
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
╔══════════════════════════════════════════════════════════════╗
║                    🔐 RPM DEBUG AUTH HELPER                   ║
╚══════════════════════════════════════════════════════════════╝

💥 REDIRIGIDO A /LOGIN? EJECUTA:
   → await switchUser('admin')

🔍 CAMBIAR DE ROL:
   → await switchUser('admin')   // ADMIN - Acceso total
   → await switchUser('staff')    // STAFF - Acceso limitado  
   → await switchUser('user')     // USER - Solo público

📋 VER USUARIO ACTUAL:
   → await fetch('/api/auth/debug').then(r => r.json()).then(console.log)

🧹 LIMPIAR SESIÓN:
   → await fetch('/api/auth/debug', {method: 'DELETE'}).then(() => location.reload())

⚡ COMANDO MÁS ÚTIL: await switchUser('admin')

💡 ESTE HELPER ESTÁ DISPONIBLE EN CUALQUIER PÁGINA DEL SITIO

──────────────────────────────────────────────────────────────

Para ver este mensaje de nuevo: showDebugHelp()
        `);
    };

    // Asignar funciones globalmente
    window.switchUser = switchUser;
    window.showDebugHelp = showHelp;
    window.help = showHelp;
    
    // Mostrar mensaje inicial
    console.log('🔐 Debug Auth Helper disponible. Ejecuta help() o showDebugHelp() para ver comandos.');
    
    // Mostrar ayuda automáticamente después de 1 segundo
    setTimeout(() => {
      showHelp();
    }, 1000);
    
    // Mostrar ayuda periódicamente cada 30 segundos
    setInterval(() => {
      console.log('🔐 Debug Auth Helper - help() para ver comandos');
    }, 30000);
  }
}

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  initDebugAuthHelper();
}
