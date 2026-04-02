# 🎭 Playwright E2E Tests - Guía para Agentes

Esta carpeta contiene tests end-to-end para validar el sistema RPM Accesorios.

## 🚀 Inicio Rápido

### 1. Pre-requisitos

```bash
# Instalar dependencias
pnpm install

# Iniciar base de datos (si no está corriendo)
pnpm db:start

# Aplicar migraciones
pnpm db:migrate
```

### 2. Modo Debug Auth (Recomendado)

Para tests E2E, usamos **Debug Auth** que permite bypass de Google OAuth:

```bash
# Iniciar servidor en modo debug
pnpm dev:debug

# O manualmente:
DEBUG_AUTH_ENABLED=true pnpm dev
```

### 3. Ejecutar Tests

```bash
# Todos los tests E2E
pnpm test:e2e

# Tests específicos
pnpm test:e2e tests/playwright/work-orders.spec.ts

# Modo UI (visual)
pnpm test:e2e:ui

# Solo tests de seguridad
pnpm test:e2e tests/playwright/security/
```

---

## 🔧 Debug Auth - Bypass de Autenticación

### ¿Qué es?

Sistema que permite autenticarse automáticamente con cualquier rol (USER, STAFF, ADMIN) sin usar Google OAuth. **Solo funciona en desarrollo local.**

### Uso Básico

```typescript
import { test, expect } from '@playwright/test';
import { loginAs, logout } from './helpers/auth';

test('nombre del test', async ({ page }) => {
  // 1. Login con rol específico
  await loginAs(page, 'ADMIN');  // o 'STAFF', 'USER'
  
  // 2. Navegar a sección protegida
  await page.goto('/adm/products');
  
  // 3. La página carga sin pedir login
  await expect(page).toHaveURL('/adm/products');
});
```

### Roles Disponibles

| Rol | Acceso | Uso típico |
|-----|--------|------------|
| `ADMIN` | Todo el sistema | Tests de CRUD, administración |
| `STAFF` | /adm limitado | Tests de operaciones diarias |
| `USER` | Solo / (público) | Tests de redirección, permisos |

### Cambiar Rol en Runtime

```typescript
test('probar diferentes permisos', async ({ page }) => {
  // Como ADMIN - puede acceder
  await loginAs(page, 'ADMIN');
  await page.goto('/adm/users');
  await expect(page).toHaveURL('/adm/users');
  
  // Cambiar a USER - no puede acceder
  await loginAs(page, 'USER');
  await page.goto('/adm/users');
  await expect(page).toHaveURL('/');  // Redirigido
});
```

### Setup Automático

```typescript
import { setupAuth } from './helpers/auth';

test.describe('Suite de tests', () => {
  // Login antes de cada test
  test.beforeEach(async ({ page }) => {
    await setupAuth(page, 'ADMIN');
  });
  
  test('test 1', async ({ page }) => {
    // Ya está logueado como ADMIN
    await page.goto('/adm/products');
  });
  
  test('test 2', async ({ page }) => {
    // Ya está logueado como ADMIN
    await page.goto('/adm/categories');
  });
});
```

---

## 📂 Estructura de Tests

```
tests/playwright/
├── helpers/
│   └── auth.ts          # Helpers de autenticación
├── security/
│   ├── debug-auth-security.spec.ts  # Tests de seguridad
│   ├── debug-auth-security-plan.md  # Plan de pruebas
│   └── SECURITY_CERTIFICATION_REPORT.md  # Reporte de certificación
├── work-orders.spec.ts   # Ejemplo: Tests de órdenes de trabajo
└── README.md            # Este archivo
```

---

## 🎯 Casos de Uso por Sección

### Testear Productos (`/adm/products`)

```typescript
test('CRUD de productos', async ({ page }) => {
  await loginAs(page, 'ADMIN');
  await page.goto('/adm/products');
  
  // Crear producto
  await page.click('text=Nuevo Producto');
  await page.fill('[name="name"]', 'Producto Test');
  await page.click('text=Guardar');
  
  // Verificar que aparece en la lista
  await expect(page.locator('text=Producto Test')).toBeVisible();
});
```

### Testear Permisos de Rol

```typescript
test('USER no puede editar productos', async ({ page }) => {
  await loginAs(page, 'USER');
  await page.goto('/adm/products');
  
  // Redirigido a home
  await expect(page).toHaveURL('/');
});
```

### Testear APIs Protegidas

```typescript
test('API de productos requiere auth', async ({ request }) => {
  const response = await request.get('/api/products');
  expect(response.status()).toBe(401);  // Sin auth
  
  // Con auth (usando helper de API)
  const { cookies } = await loginAsApi(request, 'ADMIN');
  const response2 = await request.get('/api/products', {
    headers: { cookie: cookies }
  });
  expect(response2.status()).toBe(200);  // Con auth
});
```

---

## 🔒 Seguridad

### IMPORTANTE: Solo para Desarrollo

- ✅ Debug Auth **solo funciona en `NODE_ENV=development`**
- ✅ Requiere `DEBUG_AUTH_ENABLED=true` explícito
- ❌ **NUNCA** funciona en producción
- ❌ **NUNCA** commitear `.env.local` con `DEBUG_AUTH_ENABLED=true`

### Verificación de Seguridad

```bash
# Ejecutar tests de seguridad
pnpm test:e2e tests/playwright/security/debug-auth-security.spec.ts
```

Ver reporte completo en: `tests/playwright/security/SECURITY_CERTIFICATION_REPORT.md`

---

## 🐛 Troubleshooting

### "Failed to create debug session"

**Causa:** Servidor no está corriendo en modo debug  
**Solución:**
```bash
pnpm dev:debug
```

### "No redirect to login"

**Causa:** Ya hay una sesión activa  
**Solución:**
```typescript
await logout(page);  // Limpiar sesión antes
await page.goto('/adm/products');
```

### Tests fallan por timeout

**Causa:** Servidor no responde  
**Solución:**
```bash
# Verificar que el servidor está corriendo
curl http://localhost:3000/api/auth/debug

# Si no responde, reiniciar:
pnpm dev:debug
```

---

## 📚 Referencias

- **Configuración de auth:** `/auth.ts`
- **Server helpers:** `/lib/auth-server.ts`
- **API endpoint:** `/app/api/auth/debug/route.ts`
- **Reporte de seguridad:** `/tests/playwright/security/SECURITY_CERTIFICATION_REPORT.md`

---

## 💡 Tips para Agentes

1. **Siempre usar `loginAs()` antes de navegar a `/adm/*`**
2. **Cambiar de rol para probar permisos diferentes**
3. **Usar `setupAuth()` en `beforeEach` para suites completas**
4. **No hardcodear cookies - usar siempre los helpers**
5. **Si algo falla, verificar que el servidor esté en modo debug**

---

**¿Preguntas?** Revisa el reporte de seguridad o los ejemplos en `work-orders.spec.ts`
