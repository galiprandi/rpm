# 🔐 Debug Auth Helper - Guía Rápida

## 📋 ¿Qué es?

Helper para desarrollo que permite cambiar rápidamente de usuario durante el testing del panel de administración.

**⚠️ IMPORTANTE**: Solo funciona en modo desarrollo con `DEBUG_AUTH_ENABLED=true`

---

## 🚀 Uso Rápido

### **1. Cambiar de Usuario**
```javascript
// En la consola del navegador
await window.switchUser('admin')  // ADMIN - Acceso total
await window.switchUser('staff')   // STAFF - Acceso limitado  
await window.switchUser('user')    // USER - Solo público
```

### **2. Ver Usuario Actual**
```javascript
await window.currentUser()
// Output: "Debug ADMIN (ADMIN)"
```

### **3. Limpiar Sesión**
```javascript
await window.clearDebugSession()
```

### **4. Ver Ayuda Completa**
```javascript
window.showDebugHelp()  // Muestra recordatorio detallado
```

---

## 🎯 Casos de Uso

### **Testeo de Permisos**
```javascript
// Como ADMIN - debería poder acceder a todo
await window.switchUser('admin')
location.href = '/adm/users'  // ✅ Funciona

// Como STAFF - acceso limitado
await window.switchUser('staff') 
location.href = '/adm/users'  // ❌ Redirigido

// Como USER - sin acceso a admin
await window.switchUser('user')
location.href = '/adm/products'  // ❌ Redirigido a home
```

### **Testeo de Importador**
```javascript
// Cambiar a ADMIN para acceder al importador
await window.switchUser('admin')
location.href = '/adm/products/import'
```

### **Debugging de Roles**
```javascript
// Ver rol actual
await window.currentUser()

// Cambiar y verificar
await window.switchUser('staff')
await window.currentUser()  // "Debug STAFF (STAFF)"
```

---

## 🔒 Seguridad

### **✅ En Producción**
- **NO funciona** - Helper deshabilitado automáticamente
- **Seguro** - No expone funcionalidad de auth
- **Sin riesgo** - Solo disponible en `localhost`

### **🛡️ Verificaciones de Seguridad**
```typescript
// El helper verifica:
1. Estamos en localhost
2. NODE_ENV === 'development'  
3. DEBUG_AUTH_ENABLED === 'true'
4. Si no cumple alguna, no se inicializa
```

---

## 📝 Mensajes de Ayuda

Al cargar el admin panel en desarrollo, verás en consola:

```
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
```

### **Mensaje de Ayuda Adicional**
Si olvidas los comandos, simplemente ejecuta:
```javascript
window.showDebugHelp()
```

Esto mostrará un recordatorio completo con todos los comandos útiles.

---

## 🐛 Troubleshooting

### **"switchUser is not defined"**
- Verifica que estés en `localhost:3000`
- Confirma que `DEBUG_AUTH_ENABLED=true`
- Recarga la página

### **"No disponible en producción"**
- Es normal - el helper está deshabilitado por seguridad
- Usa el flujo normal de auth en producción

### **Error al cambiar usuario**
- Revisa la consola para mensajes específicos
- Verifica que el servidor esté corriendo
- Intenta recargar la página y volver a intentar

---

## 💡 Tips para Desarrollo

### **Flujo de Testing Típico**
```javascript
// 1. Iniciar como ADMIN
await window.switchUser('admin')

// 2. Probar funcionalidad completa
location.href = '/adm/products/import'

// 3. Testear permisos de STAFF
await window.switchUser('staff')
location.href = '/adm/users'  // Debería redirigir

// 4. Testear acceso de USER
await window.switchUser('user')  
location.href = '/adm'  // Debería redirigir a home
```

### **Testing de APIs**
```javascript
// Cambiar a ADMIN y probar APIs protegidas
await window.switchUser('admin')
fetch('/api/admin/users')  // ✅ 200

// Cambiar a STAFF y probar restricciones
await window.switchUser('staff')
fetch('/api/admin/users')  // ❌ 403
```

---

## 🔧 Integración

El helper se inicializa automáticamente en:

```typescript
// components/adm/layout/AdminClientLayout.tsx
useEffect(() => {
  initDebugHelpers();
}, []);
```

Así que está disponible en **todas las páginas del admin panel** durante desarrollo.

---

## 📚 Referencias

- **Configuración Debug Auth**: `/app/api/auth/debug/route.ts`
- **Proxy Middleware**: `/proxy.ts`
- **Tests E2E**: `/tests/playwright/helpers/auth.ts`

---

*Helper creado para facilitar el desarrollo y testing del sistema de permisos RPM Accesorios.*
