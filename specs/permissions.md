# Spec: Sistema de Permisos por Rol

🟢 Aprobado — Implementación en curso

## Problema

El sistema actual tiene 3 roles (USER → STAFF → ADMIN) donde `SELLER` en DB se mapea a `ADMIN`, dando a los vendedores acceso total. El encargado de RPM necesita que el rol Vendedor haga "todo menos ajustar inventario", con flexibilidad para ajustar permisos desde la UI sin tocar código.

## Solución

Sistema de permisos **allowlist** con catálogo declarativo, configurable desde Settings por un ADMIN. Admin siempre tiene todos los permisos (hardcodeado, no configurable).

### Modelo

```
USER (0) → STAFF (1) → VENDEDOR (2) → ADMIN (3)
```

- `SELLER` en DB → mapea a `VENDEDOR` (no a ADMIN)
- `TECHNICIAN`, `CASHIER` → mapean a `VENDEDOR`
- ADMIN no aparece en la tabla de permisos — `hasPermission()` devuelve `true` siempre

### Allowlist (positivos)

Se guardan los permisos que cada rol **tiene**. Al crear un rol nuevo o agregar una feature, el default es **sin permisos** (seguro). Un permiso olvidado se manifiesta como "no puedo hacer X" (visible), no como un leak silencioso.

### Tabla DB

```sql
role_permission (
  role        TEXT NOT NULL,        -- 'STAFF' | 'VENDEDOR'
  permission  TEXT NOT NULL,        -- 'can_edit_products' | ...
  enabled     BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (role, permission)
)
```

- Filas solo para STAFF y VENDEDOR
- ADMIN no tiene filas — permisos hardcodeados en código

### Catálogo Declarativo (~15 permisos)

Fuente de verdad en `lib/permissions/catalog.ts`. Sirve para:
1. UI de Settings itera sobre él para renderizar toggles
2. Backend valida que permisos solicitados existan
3. Sidebar mapea permisos → secciones visibles

| Categoría | Permiso | Descripción |
|-----------|--------|-------------|
| Catálogo | `can_edit_products` | CRUD productos (sin costo/stock) |
| Catálogo | `can_edit_costs` | Editar costos de productos y servicios |
| Catálogo | `can_edit_stock` | Editar stock de productos |
| Catálogo | `can_manage_categories` | CRUD categorías |
| Catálogo | `can_manage_services` | CRUD servicios (sin costos) |
| Catálogo | `can_manage_suppliers` | CRUD proveedores |
| Ventas | `can_manage_customers` | CRUD clientes |
| Ventas | `can_create_sales` | Ventas directas |
| Ventas | `can_create_credit_notes` | Crear notas de crédito |
| Ventas | `can_cancel_credit_notes` | Cancelar notas de crédito |
| Finanzas | `can_manage_cash` | Abrir/cerrar caja + movimientos |
| Finanzas | `can_approve_inventory` | Crear/aprobar inventory counts |
| Admin | `can_manage_users` | CRUD usuarios |
| Admin | `can_manage_settings` | Configuración global |
| Admin | `can_run_maintenance` | Recalcular balances |

### Defaults (seed)

| Permiso | STAFF | VENDEDOR |
|---------|:-----:|:--------:|
| can_edit_products | ❌ | ✅ |
| can_edit_costs | ❌ | ❌ |
| can_edit_stock | ❌ | ❌ |
| can_manage_categories | ❌ | ✅ |
| can_manage_services | ❌ | ✅ |
| can_manage_suppliers | ❌ | ✅ |
| can_manage_customers | ❌ | ✅ |
| can_create_sales | ❌ | ✅ |
| can_create_credit_notes | ❌ | ✅ |
| can_cancel_credit_notes | ❌ | ❌ |
| can_manage_cash | ❌ | ✅ |
| can_approve_inventory | ❌ | ❌ |
| can_manage_users | ❌ | ❌ |
| can_manage_settings | ❌ | ❌ |
| can_run_maintenance | ❌ | ❌ |

### Sesión

Los permisos se cargan al hacer login y se guardan en `session.user.permissions: string[]`:
- ADMIN: `['*']` (hardcodeado)
- STAFF/VENDEDOR: array de permission IDs desde DB

Al cambiar permisos desde Settings, los usuarios afectados deben re-login para ver los cambios.

### Backend

**`lib/permissions/check.ts`:**
- `hasPermission(session, permission)`: ADMIN → true, resto → `permissions.includes(permission)`
- `withPermission(permission)`: middleware wrapper para API routes (reemplaza `withAdmin`/`withStaff`)

**Migración de rutas (~25):**
- `withAdmin` → `withPermission('can_xxx')` según el catálogo
- `withStaff` → `withPermission('can_xxx')` o `withAuth` según el caso
- Fix de rutas sin protección: suppliers, services/[id]

**Field-level checks:**
- `/api/products` POST/PUT: si `!hasPermission(session, 'can_edit_costs')`, rechazar `costPrice`/`replacementCost`
- `/api/products` POST/PUT: si `!hasPermission(session, 'can_edit_stock')`, rechazar `stock`/`minStock`
- `/api/services` POST/PUT: si `!hasPermission(session, 'can_edit_costs')`, rechazar `baseCost`

### Frontend

**`components/ui/UserProvider.tsx`:**
- Context con `{ role, permissions, can(permission) }`
- `can('can_edit_costs')` → true si `permissions.includes('*')` o `permissions.includes('can_edit_costs')`
- Wrap en `AdminClientLayout`

**Forms:**
- `ProductForm`: oculta `costPrice`, `replacementCost` si `!can('can_edit_costs')`; oculta `stock`, `minStock` si `!can('can_edit_stock')`. En submit, no envía campos ocultos.
- `ServiceForm`: oculta `baseCost` si `!can('can_edit_costs')`
- `ProductsClient`: oculta stat "Valor inventario" si `!can('can_edit_costs')`

**Sidebar (`lib/nav/navConfig.ts`):**
- Cada NavItem tiene `requiredPermission` en vez de `roles: UserRole[]`
- `AppSidebar` filtra con `can(item.requiredPermission)`
- Secciones sin `requiredPermission` son visibles para cualquier usuario autenticado de /adm

**UI Settings (`app/adm/settings/permissions/`):**
- Matriz compacta: categorías como secciones, permisos como filas, roles como columnas
- Roles configurables: STAFF y VENDEDOR (Admin no aparece)
- Botón "Guardar cambios" (batch PUT)
- Banner: "Los cambios requieren re-login de los usuarios afectados"

### API

**`app/api/permissions/route.ts`:**
- GET: devuelve permisos actuales por rol (desde DB)
- PUT: guarda matriz completa (batch, solo ADMIN)
- Valida que todos los permisos existan en el catálogo

### Regla del encargado

"Vendedor hace todo menos ajustar inventario" se traduce a:
- ✅ VENDEDOR tiene: `can_edit_products`, `can_manage_categories`, `can_manage_services`, `can_manage_suppliers`, `can_manage_customers`, `can_create_sales`, `can_create_credit_notes`, `can_manage_cash`
- ❌ VENDEDOR no tiene: `can_edit_costs`, `can_edit_stock`, `can_approve_inventory`, `can_cancel_credit_notes`, `can_manage_users`, `can_manage_settings`, `can_run_maintenance`

CRUD completo de productos salvo modificar stock → `can_edit_products` ✅ + `can_edit_stock` ❌

### Consideraciones

- **Migración de usuarios**: los usuarios con `SELLER` en DB pasarán de ADMIN a VENDEDOR. Pierden acceso a users/settings/maintenance. Esto es intencional.
- **STAFF**: queda como rol mínimo (acceso a /adm pero sin CRUD de catálogo). Si no hay usuarios STAFF reales, no afecta nada.
- **Sin librería externa**: implementación propia (~20 líneas para hasPermission + withPermission). Suficiente para 2 roles configurables + ADMIN fijo.
