# API Middleware - Sistema de Protección Global

## Resumen

Sistema de protección tipo middleware para endpoints de API basado en roles. Permite proteger rutas de forma declarativa usando wrapper functions.

## Componentes

### 1. Wrapper Functions (`lib/api-middleware.ts`)

Funciones reutilizables que envuelven los handlers de rutas para agregar autenticación y control de roles.

#### Disponibles

- **`withAuth(handler)`** - Requiere autenticación (cualquier usuario logueado)
- **`withRole(role, handler)`** - Requiere autenticación y rol específico (jerárquico)
- **`withAdmin(handler)`** - Requiere rol ADMIN (convenience function)
- **`withStaff(handler)`** - Requiere rol STAFF o superior (convenience function)
- **`withPublic(handler)`** - Sin protección (para endpoints públicos)

#### Jerarquía de Roles

```
USER (nivel 0)    < STAFF (nivel 1) < ADMIN (nivel 2)
```

- `withRole(UserRole.STAFF)` permite STAFF y ADMIN
- `withRole(UserRole.ADMIN)` solo permite ADMIN

### 2. Configuración Central (`lib/api-routes-config.ts`)

Archivo central que define qué rol requiere cada endpoint. Sirve como referencia y documentación.

```typescript
export const API_ROUTES_CONFIG: RouteConfig[] = [
  {
    path: '/api/products',
    methods: ['GET'],
    role: 'STAFF',
    description: 'List products',
  },
  // ...
];
```

## Uso

### Ejemplo Básico

```typescript
import { withStaff, withAdmin } from '@/lib/api-middleware';
import { NextRequest, NextResponse } from 'next/server';

// GET - Requiere STAFF o ADMIN
export const GET = withStaff(async (request: NextRequest, session) => {
  // session.user está disponible
  return NextResponse.json({ data });
});

// POST - Requiere ADMIN
export const POST = withAdmin(async (request: NextRequest, session) => {
  // Solo ADMIN puede ejecutar esto
  return NextResponse.json({ data });
});
```

### Ejemplo con Parámetro No Usado

Si el handler no necesita el objeto `session`, usa `_session` con eslint-disable:

```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withStaff(async (request: NextRequest, _session) => {
  // Handler no usa session pero el wrapper lo requiere
  return NextResponse.json({ data });
});
```

### Ejemplo Completo

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withStaff, withAdmin } from '@/lib/api-middleware';
import { createProduct } from '@/lib/services/productService';

// GET /api/products - Listar (STAFF+)
export const GET = withStaff(async (request: NextRequest, _session) => {
  const products = await getProducts();
  return NextResponse.json({ products });
});

// POST /api/products - Crear (ADMIN only)
export const POST = withAdmin(async (request: NextRequest, session) => {
  const body = await request.json();
  const product = await createProduct({
    ...body,
    createdBy: session.user.id, // Usa session para audit trail
  });
  return NextResponse.json(product, { status: 201 });
});
```

## Migración de Endpoints Existentes

### Antes (Sin Protección)

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const product = await createProduct(body);
  return NextResponse.json(product);
}
```

### Después (Con Protección)

```typescript
import { withAdmin } from '@/lib/api-middleware';

export const POST = withAdmin(async (request: NextRequest, session) => {
  const body = await request.json();
  const product = await createProduct({
    ...body,
    createdBy: session.user.id,
  });
  return NextResponse.json(product);
});
```

## Endpoints Protegidos (Ejemplos)

Ya aplicados como ejemplo:

- ✅ `/api/products` (GET → withStaff, POST → withAdmin)
- ✅ `/api/categories` (GET → withStaff, POST → withAdmin)

## Endpoints Pendientes de Protección

Según auditoría de seguridad, estos endpoints necesitan protección:

### CRÍTICO - Sin Autenticación

- `/api/products/[id]` (GET, PUT, DELETE)
- `/api/customers` (GET, POST)
- `/api/customers/[id]` (GET, PUT, DELETE)
- `/api/services` (GET, POST)
- `/api/settings` (GET, PUT)
- `/api/price-lists` (GET, POST)
- `/api/import/products/execute` (POST)
- `/api/files/upload` (POST, GET)

### ALTO - Auth sin Rol

- `/api/cost-updates/preview` (POST) → Debería ser withAdmin
- `/api/cost-updates/apply` (POST) → Debería ser withAdmin
- `/api/direct-sales` (POST) → Debería ser withStaff
- `/api/cash/status` (GET) → Ya tiene auth, considerar withStaff

## Pasos para Migrar un Endpoint

1. **Importar wrappers:**
   ```typescript
   import { withStaff, withAdmin } from '@/lib/api-middleware';
   ```

2. **Consultar configuración:**
   - Revisar `/lib/api-routes-config.ts` para saber qué rol requiere
   - Usar `getRouteRole(path, method)` si es necesario

3. **Aplicar wrapper:**
   ```typescript
   export const GET = withStaff(async (request, session) => {
     // ...
   });
   ```

4. **Actualizar handler:**
   - Agregar parámetro `session`
   - Usar `session.user.id` para audit trail si es necesario
   - Remover llamadas manuales a `getSession()` o `auth.api.getSession()`

5. **Probar:**
   - Verificar que retorna 401 sin auth
   - Verificar que retorna 403 con rol insuficiente
   - Verificar que funciona con rol correcto

## Ventajas

- ✅ **Declarativo** - Protección visible en la firma de la función
- ✅ **Reusable** - Mismo patrón en todos los endpoints
- ✅ **Type-safe** - TypeScript valida tipos
- ✅ **Centralizado** - Configuración en un solo archivo
- ✅ **Mantenible** - Cambios en un lugar afectan todos los wrappers

## Errores Comunes

### 1. Olvidar importar wrappers

```typescript
// ❌ Error
export const GET = withStaff(async (request, session) => { ... });

// ✅ Correcto
import { withStaff } from '@/lib/api-middleware';
export const GET = withStaff(async (request, session) => { ... });
```

### 2. No cambiar `async function` a `async` en export

```typescript
// ❌ Error
export async function GET(request) { ... }

// ✅ Correcto
export const GET = withStaff(async (request, session) => { ... });
```

### 3. No usar el parámetro session cuando se necesita

```typescript
// ❌ Error - session no disponible
export const POST = withAdmin(async (request) => {
  const userId = ???; // No hay session
});

// ✅ Correcto
export const POST = withAdmin(async (request, session) => {
  const userId = session.user.id;
});
```

## Testing

### Test sin autenticación

```bash
curl -X GET http://localhost:3000/api/products
# Expected: 401 Unauthorized
```

### Test con rol insuficiente

```bash
# Development testing with bypass
# Start dev server with: RPM_DEV_BYPASS_AUTH=true pnpm dev
curl -X GET http://localhost:3000/api/products
# Expected: 200 OK (bypass auth en desarrollo con RPM_DEV_BYPASS_AUTH=true)
```

### Test con rol correcto (producción)

```bash
curl -X GET http://localhost:3000/api/products \
  -H 'Cookie: better-auth.session=...' \
# Expected: 200 OK con datos
```

## Referencias

- Especificación de roles: `lib/auth/roles.ts`
- Configuración de endpoints: `lib/api-routes-config.ts`
- Sistema de autenticación: `lib/auth-server.ts`
- Auditoría de seguridad: Ver reporte anterior en conversación
