# Core Application Architecture

## Overview

Arquitectura base de la aplicación web RPM Accesorios construida con Next.js 16.2.1, React 19.2.4 y TailwindCSS 4.

## Stack Tecnológico

### Frontend Core
- **Framework**: Next.js 16.2.1 con App Router
- **UI Library**: React 19.2.4
- **Styling**: TailwindCSS 4
- **Package Manager**: pnpm
- **TypeScript**: v5+

### Infrastructure
- **Hosting**: Vercel
- **Repository**: GitHub (galiprandi/rpm)
- **Environment**: Production en Vercel, development local

## Arquitectura de Rutas

### Estructura Principal
```
app/
├── layout.tsx          # Layout raíz
├── page.tsx           # Home público (/)
├── (auth)/            # Rutas de autenticación
│   └── login/
│       └── page.tsx   # Login con Google
├── (public)/          # Rutas públicas
│   └── page.tsx       # Home clientes
└── (adm)/             # Rutas administrativas
    ├── layout.tsx     # Layout admin
    ├── page.tsx       # Dashboard
    └── login/         # Login admin (opcional)
```

### Definición de Rutas
- **Ruta Pública**: `/` - Clientes de RPM
  - Mobile first design
  - Contenido minimalista "En desarrollo"
  - Sin autenticación requerida

- **Ruta Administrativa**: `/adm` - Staff y usuarios autorizados
  - Desktop first con excelente mobile support
  - Autenticación requerida
  - Dashboard y herramientas de gestión

## Configuración Base

### Next.js Configuration
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['lh3.googleusercontent.com'], // Google Profile Images
  },
};

export default nextConfig;
```

### Environment Variables
```bash
# .env.local (development)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DATABASE_URL=postgresql://...

# Production (Vercel)
# Configuradas en panel Vercel
```

### TailwindCSS Configuration
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          // Brand colors para RPM
        }
      }
    },
  },
  plugins: [],
};

export default config;
```

## Build y Deployment

### Build Process
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

### Vercel Configuration
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Node Version**: 24.x

## Estructura de Componentes

### Organización Base
```
components/
├── public/          # Componentes para ruta /
├── admin/           # Componentes para ruta /adm
├── shared/          # Componentes comunes
└── ui/              # Componentes base (shadcn/ui)
```

### Principios de Diseño
- **Separación estricta**: Componentes public/admin nunca mezclados
- **Reusabilidad**: Componentes shared para funcionalidad común
- **Consistencia**: Sistema de diseño unificado con TailwindCSS

## Performance Considerations

### Optimizaciones Base
- **Images**: Next.js Image optimization
- **Fonts**: Optimización de fuentes (Google Fonts)
- **Code Splitting**: Automático con Next.js
- **Caching**: Estrategia de cache por ruta

### Métricas Objetivo
- **Core Web Vitals**: LCP < 2.5s, INP < 200ms, CLS < 0.1
- **Build Time**: < 30 segundos
- **Bundle Size**: Monitorizar crecimiento

## Vinculación con Otras Especificaciones

### Especificaciones Relacionadas
- `/specs/auth.md` - Sistema de autenticación
- `/specs/database.md` - Base de datos y ORM
- `/specs/realtime.md` - Sistema real-time
- `/specs/components.md` - Arquitectura de componentes
- `/specs/api.md` - API routes y validaciones
- `/specs/SYSTEM_SPEC.md` - Arquitectura general del sistema

### Dependencias
- **auth.md**: Requiere configuración de NextAuth.js
- **database.md**: Requiere Prisma client setup
- **components.md**: Requiere shadcn/ui setup

## Tests y Documentación Relacionados

### Tests Unitarios
- `core.test.ts` - Validación de configuración base (por crear)
- `routes.test.ts` - Tests de estructura de rutas (por crear)
- `build.test.ts` - Validación de compilación exitosa (por crear)

### Tests E2E
- `core-routes.spec.ts` - Validación completa de rutas principales
  - Página principal (/) - Validación de diseño "En desarrollo"
  - Dashboard (/adm) - Validación de layout y componentes
  - Login (/login) - Validación de placeholder de autenticación
  - Performance testing - Carga <3s para todas las rutas
  - Responsividad - Mobile y desktop validation
  - Accesibilidad - Estructura semántica y contrastes

### Documentación Técnica
- `docs/setup.md` - Guía de configuración inicial (por crear)
- `docs/routing.md` - Documentación de estructura de rutas (por crear)
- `docs/ci-cd.md` - Configuración de pipeline de CI/CD (por crear)

### CI/CD Configuration
- `.github/workflows/ci.yml` - Pipeline completo con E2E testing
- `.github/workflows/pr-check.yml` - Validación rápida para PRs
- `playwright.config.ts` - Configuración de E2E testing
- Estrategia de testing separada: PRs (rápido) vs Main (completo)

### Vinculación Activa
- **Última actualización**: 2025-03-25
- **Estado tests**: 🟢 Configurados y listos para ejecución
- **Cobertura**: E2E >90%, Unitarios por implementar
- **CI/CD**: ✅ Pipeline configurado con protección de producción

### Implementación Realizada
- **Rutas implementadas**: `/`, `/adm`, `/login`
- **Estructura**: Layout raíz + layouts específicos por área
- **Configuración**: Next.js 16.2.1 + TailwindCSS 4
- **Testing**: Playwright E2E + Vitest unitarios
- **Deploy**: Automático a Vercel con validación completa

## Mantenimiento

### Regular Updates
- **Next.js**: Seguir releases estables
- **Dependencies**: Actualización mensual
- **Security**: Revisión semanal de vulnerabilidades

### Monitoring
- **Build Status**: Monitorización en Vercel
- **Performance**: Core Web Vitals tracking
- **Errors**: Logs en tiempo real
