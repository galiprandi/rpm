/**
 * 🔐 Debug Auth Helper - Solo para Desarrollo
 * 
 * Funciones helper para cambiar de usuario rápidamente durante desarrollo.
 * NO funciona en producción por seguridad.
 */

declare global {
  interface Window {
    switchUser?: (role: 'admin' | 'staff' | 'user') => Promise<void>;
    currentUser?: () => Promise<string>;
    clearDebugSession?: () => Promise<void>;
    showDebugHelp?: () => void;
  }
}

/**
 * Verifica si estamos en modo desarrollo y debug auth está habilitado
 */
function isDebugMode(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost' &&
    process.env.NODE_ENV === 'development' &&
    process.env.DEBUG_AUTH_ENABLED === 'true'
  );
}

/**
 * Cambia el usuario de debug (solo en desarrollo)
 */
async function switchUser(role: 'admin' | 'staff' | 'user'): Promise<void> {
  // Seguridad: solo funciona en desarrollo
  if (!isDebugMode()) {
    console.warn('❌ switchUser() solo funciona en modo desarrollo con DEBUG_AUTH_ENABLED=true');
    return;
  }

  const roleMap = {
    admin: 'ADMIN',
    staff: 'STAFF', 
    user: 'USER'
  };

  try {
    console.log(`🔄 Cambiando a ${role.toUpperCase()}...`);
    
    const response = await fetch('/api/auth/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: roleMap[role] })
    });

    if (!response.ok()) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Usuario cambiado:', result.user.name);
    
    // Recargar la página para aplicar cambios
    location.reload();
    
  } catch (error) {
    console.error('❌ Error al cambiar usuario:', error);
  }
}

/**
 * Muestra recordatorio de ayuda cuando hay problemas de permisos
 */
export function showDebugAuthReminder(): void {
  if (!isDebugMode()) {
    return;
  }

  console.log(`
🚨 ¿Problemas de acceso? Recordatorio de Debug Auth:

💥 Si te redirigen a /login o no puedes acceder:
   → Ejecuta: await window.switchUser('admin')

🔍 Para testear diferentes permisos:
   → ADMIN: await window.switchUser('admin')  (acceso total)
   → STAFF: await window.switchUser('staff')   (acceso limitado)
   → USER:  await window.switchUser('user')    (solo público)

📋 Ver usuario actual:
   → await window.currentUser()

🧹 Limpiar sesión:
   → await window.clearDebugSession()

⚡ El comando más útil: await window.switchUser('admin')
  `);
}

/**
 * Obtiene el usuario actual de debug
 */
async function currentUser(): Promise<string> {
  if (!isDebugMode()) {
    return 'No disponible en producción';
  }

  try {
    const response = await fetch('/api/auth/debug');
    const data = await response.json();
    
    if (data.authenticated && data.user) {
      return `${data.user.name} (${data.user.role})`;
    }
    
    return 'No autenticado';
    
  } catch {
    return 'Error al obtener usuario';
  }
}

/**
 * Limpia la sesión de debug
 */
async function clearDebugSession(): Promise<void> {
  if (!isDebugMode()) {
    console.warn('❌ clearDebugSession() solo funciona en modo desarrollo');
    return;
  }

  try {
    await fetch('/api/auth/debug', { method: 'DELETE' });
    console.log('✅ Sesión debug limpiada');
    location.reload();
  } catch (error) {
    console.error('❌ Error al limpiar sesión:', error);
  }
}

/**
 * Inicializa las funciones helper en window (solo en desarrollo)
 */
export function initDebugHelpers(): void {
  // Solo inicializar en modo desarrollo
  if (!isDebugMode()) {
    return;
  }

  // Asignar funciones a window
  window.switchUser = switchUser;
  window.currentUser = currentUser;
  window.clearDebugSession = clearDebugSession;
  window.showDebugHelp = showDebugAuthReminder;

  // Mensaje de ayuda en consola
  console.log(`
🔐 Debug Auth Helper disponible!
  
Comandos rápidos:
• await window.switchUser('admin')  - Cambiar a ADMIN (acceso total)
• await window.switchUser('staff')   - Cambiar a STAFF (acceso limitado)  
• await window.switchUser('user')    - Cambiar a USER (solo público)
• await window.currentUser()         - Ver usuario actual
• await window.clearDebugSession()   - Limpiar sesión

💡 Recordatorio futuro:
• Si te redirigen a /login, ejecuta: await window.switchUser('admin')
• Para testear permisos: await window.switchUser('staff') o 'user'
• El helper solo funciona en desarrollo con DEBUG_AUTH_ENABLED=true
• Para ver ayuda completa: window.showDebugHelp()

Ejemplo de uso:
await window.switchUser('admin')  // ← Recarga automáticamente con acceso ADMIN
  `);
}

// Auto-inicializar si estamos en desarrollo
if (typeof window !== 'undefined') {
  initDebugHelpers();
}
