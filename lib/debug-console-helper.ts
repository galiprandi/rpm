/**
 * 🔐 Console Debug Helper - Global y Simple
 * 
 * Se carga en cualquier página y muestra ayuda al abrir la consola
 */

// Función global para cambiar de usuario
async function switchUser(role: 'admin' | 'staff' | 'user'): Promise<void> {
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
}

// Función para mostrar ayuda
function showHelp(): void {
  console.log(`
🔐 RPM Debug Auth Helper - Comandos rápidos:

💥 Si te redirigen a /login o no puedes acceder:
   → await switchUser('admin')

🔍 Cambiar de rol:
   → await switchUser('admin')   // ADMIN - Acceso total
   → await switchUser('staff')    // STAFF - Acceso limitado  
   → await switchUser('user')     // USER - Solo público

📋 Ver usuario actual:
   → await fetch('/api/auth/debug').then(r => r.json()).then(console.log)

🧹 Limpiar sesión:
   → await fetch('/api/auth/debug', {method: 'DELETE'}).then(() => location.reload())

⚡ Comando más útil: await switchUser('admin')

💡 Este helper está disponible en cualquier página del sitio.
  `);
}

// Asignar funciones globalmente
if (typeof window !== 'undefined') {
  (window as any).switchUser = switchUser;
  (window as any).showDebugHelp = showHelp;
  
  // Mostrar ayuda al cargar la página
  console.log('🔐 Debug Auth Helper disponible. Ejecuta showDebugHelp() para ver ayuda.');
}
