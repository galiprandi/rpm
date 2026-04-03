'use client';

import { useEffect } from 'react';

/**
 * Componente que carga el Debug Auth Helper globalmente
 * Se debe incluir en el layout principal para que esté disponible en todas las páginas
 */
export function DebugConsoleHelper() {
  useEffect(() => {
    // Solo en desarrollo con debug auth habilitado
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

          if (!response.ok()) {
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
      (window as any).switchUser = switchUser;
      (window as any).showDebugHelp = showHelp;
      
      // Función para siempre mostrar ayuda
      (window as any).help = () => showHelp();
      
      // Mostrar mensaje inicial
      console.log('🔐 Debug Auth Helper disponible. Ejecuta help() o showDebugHelp() para ver comandos.');
      
      // Mostrar ayuda automáticamente
      setTimeout(() => {
        showHelp();
      }, 1000);
      
      // También mostrar ayuda periódicamente
      setInterval(() => {
        console.log('🔐 Debug Auth Helper - help() para ver comandos');
      }, 30000); // Cada 30 segundos
      
      // Mostrar ayuda cuando se detecta actividad en la consola
      let lastConsoleTime = Date.now();
      const originalLog = console.log;
      
      console.log = function(...args: any[]) {
        const now = Date.now();
        // Si ha pasado más de 5 segundos desde la última actividad
        if (now - lastConsoleTime > 5000) {
          lastConsoleTime = now;
          // Mostrar ayuda después de un pequeño delay
          setTimeout(() => {
            showHelp();
          }, 1000);
        }
        return originalLog.apply(console, args);
      };
    }
  }, []);

  // Este componente no renderiza nada visible
  return null;
}
