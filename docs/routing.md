# Routing Documentation - RPM Accesorios

## Overview

Arquitectura de rutas implementada con Next.js 16.2.1 App Router.

## Estructura de Rutas

### Rutas Principales

#### `/` - Página Pública
- **Propósito**: Landing page para clientes
- **Diseño**: Mobile-first
- **Contenido**: "En desarrollo" con branding RPM
- **Autenticación**: No requerida
- **Archivo**: `app/page.tsx`

#### `/adm` - Panel Administrativo
- **Propósito**: Dashboard para staff y usuarios autorizados
- **Diseño**: Desktop-first con excelente mobile support
- **Layout**: Sidebar colapsable estilo Jira
- **Autenticación**: Requerida (implementación futura)
- **Archivos**: `app/adm/layout.tsx`, `app/adm/page.tsx`

#### `/login` - Autenticación
- **Propósito**: Login para acceso administrativo
- **Implementación**: Placeholder para Google OAuth
- **Autenticación**: No requerida (es la página de login)
- **Archivo**: `app/(auth)/login/page.tsx`

### Rutas API

#### `/api/health` - Health Check
- **Propósito**: Verificación de estado del sistema
- **Métodos**: GET
- **Respuesta**: Status del servidor y métricas básicas
- **Archivo**: `app/api/health/route.ts`

## Layouts

### Layout Raíz (`app/layout.tsx`)
- **Alcance**: Aplicación completa
- **Función**: Configuración global, fuentes, metadata
- **Componentes**: HTML base, body, metadata SEO

### Layout Admin (`app/adm/layout.tsx`)
- **Alcance**: Rutas bajo `/adm`
- **Componentes**: 
  - Sidebar colapsable (64px ↔ 256px)
  - Botón toggle con animación
  - Título "RPM Admin"
  - Main content wrapper

### Layout Auth (`app/(auth)/layout.tsx`)
- **Alcance**: Rutas de autenticación
- **Estado**: No implementado (usa layout raíz)

## Convenciones de Nomenclatura

### Route Groups
- `(auth)/` - Rutas de autenticación (no afectan URL)
- `adm/` - Rutas directas (afectan URL)

### Archivos
- `layout.tsx` - Layout de la ruta
- `page.tsx` - Página principal de la ruta
- `loading.tsx` - Loading states (por implementar)
- `error.tsx` - Error boundaries (por implementar)

## Implementación Técnica

### Next.js App Router
- **Versión**: 16.2.1
- **Características**: Server Components, Streaming, Layouts anidados

### Sidebar Colapsable
```typescript
// Estado local para colapsar
const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

// Clases dinámicas
className={`transition-all duration-300 ${
  isSidebarCollapsed ? 'w-16' : 'w-64'
}`}
```

### Responsive Design
- **Página principal**: Mobile-first con breakpoints
- **Panel admin**: Desktop-first con mobile support
- **TailwindCSS**: Breakpoints `md:`, `lg:` para adaptación

## Testing de Rutas

### E2E Tests
- **Archivo**: `tests/playwright/core-routes.spec.ts`
- **Cobertura**: 100% de rutas principales
- **Validaciones**:
  - Estructura y contenido
  - Responsividad mobile/desktop
  - Performance (<3s carga)
  - Accesibilidad semántica

### Unit Tests
- **Archivo**: `app/api/health/health.test.ts`
- **Cobertura**: Health endpoint
- **Próximos**: Tests de layouts y componentes

## Performance Optimización

### Next.js Optimizations
- **Code Splitting**: Automático por ruta
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Google Fonts con preload

### Métricas Objetivo
- **LCP**: < 2.5s
- **INP**: < 200ms  
- **CLS**: < 0.1

## Seguridad

### Middleware (Por Implementar)
- Protección de rutas `/adm`
- Validación de autenticación
- Rate limiting

### Headers de Seguridad
- Configuración automática de Next.js
- CSP headers por agregar

## Futuras Extensiones

### Rutas Planificadas
- `/adm/products` - Gestión de productos
- `/adm/users` - Gestión de usuarios
- `/adm/orders` - Gestión de pedidos
- `/adm/settings` - Configuración

### Features por Implementar
- Loading states
- Error boundaries
- Route guards
- Metadata dinámica

## Troubleshooting

### Rutas No Funcionan
1. **Verificar estructura**: `app/` directory correcto
2. **Reiniciar servidor**: `pnpm run dev`
3. **Check build**: `pnpm run build`

### Sidebar No Colapsa
1. **Verificar `use client`** en layout
2. **Check useState** importado
3. **Validar clases CSS** de Tailwind

### Tests Fallan
1. **Servidor corriendo**: `pnpm run dev`
2. **Puerto correcto**: `http://localhost:3000`
3. **Browser instalado**: `npx playwright install`

## Vinculación

- **Especificación**: [`/specs/core.md`](../specs/core.md)
- **Tests**: [`/tests/playwright/core-routes.spec.ts`](../tests/playwright/core-routes.spec.ts)
- **Config**: [`tailwind.config.ts`](../tailwind.config.ts)
