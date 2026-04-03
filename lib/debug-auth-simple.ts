/**
 * 🔐 Debug Auth Helper Simple - Versión de prueba
 */

// Función simple para cambiar de usuario
async function switchUser(role: 'admin' | 'staff' | 'user'): Promise<void> {
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
}

// Función para mostrar ayuda
function showHelp(): void {
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
}

// Asignar a window globalmente
if (typeof window !== 'undefined') {
  (window as any).switchUser = switchUser;
  (window as any).showDebugHelp = showHelp;
  
  // Mostrar ayuda al cargar
  console.log('🔐 Debug Auth Helper cargado. Ejecuta showDebugHelp() para ver ayuda.');
  showHelp();
}
