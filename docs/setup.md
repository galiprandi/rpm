# Setup Guide - RPM Accesorios

## Requisitos Previos

- Node.js 24.x o superior
- pnpm 8.x o superior
- Git

## Instalación Rápida

### 1. Clonar Repositorio
```bash
git clone https://github.com/galiprandi/rpm.git
cd rpm
```

### 2. Instalar Dependencias
```bash
pnpm install
```

### 3. Configurar Environment Variables
```bash
cp .env.example .env.local
# Editar .env.local con tus variables
```

### 4. Iniciar Desarrollo
```bash
pnpm run dev
```

## Estructura del Proyecto

```
rpm/
├── app/                 # Rutas Next.js App Router
│   ├── layout.tsx      # Layout raíz
│   ├── page.tsx        # Home público
│   ├── (auth)/         # Rutas de autenticación
│   └── adm/            # Rutas administrativas
├── specs/              # Especificaciones técnicas
├── tests/              # Tests unitarios y E2E
├── docs/               # Documentación
└── public/             # Assets estáticos
```

## Scripts Disponibles

### Desarrollo
```bash
pnpm run dev          # Servidor de desarrollo
pnpm run build        # Build de producción
pnpm run start         # Servidor de producción
```

### Calidad
```bash
pnpm run lint          # Linting ESLint
pnpm run type-check    # Verificación TypeScript
```

### Testing
```bash
pnpm run test          # Tests unitarios
pnpm run test:e2e      # Tests E2E (modo CI)
pnpm run test:e2e:dev  # Tests E2E (modo dev con UI)
```

## Flujo de Trabajo

### 1. Desarrollo Local
```bash
# Iniciar servidor
pnpm run dev

# Ejecutar tests en modo watch
pnpm run test:ui

# Tests E2E en modo desarrollo
pnpm run test:e2e:dev
```

### 2. Validación Antes de Commit
```bash
# Verificar tipos
pnpm run type-check

# Linting
pnpm run lint

# Tests completos
pnpm run test:run
pnpm run test:e2e
```

### 3. Build Final
```bash
# Build de producción
pnpm run build

# Verificar build
pnpm run start
```

## Configuración IDE

### VS Code
Recomendado instalar extensiones:
- Tailwind CSS IntelliSense
- TypeScript Importer
- ESLint
- Prettier

### Environment Variables
Variables requeridas en `.env.local`:
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DATABASE_URL=postgresql://...
```

## Troubleshooting

### Problemas Comunes

**Build falla por tipos:**
```bash
pnpm run type-check
# Corregir errores de TypeScript
```

**Tests E2E fallan:**
```bash
# Asegurar servidor corriendo
pnpm run dev

# Ejecutar en modo debug
pnpm run test:e2e:debug
```

**TailwindCSS no funciona:**
```bash
# Verificar configuración en tailwind.config.ts
# Reiniciar servidor de desarrollo
```

## Próximos Pasos

1. Revisar [`/specs/core.md`](../specs/core.md) para arquitectura
2. Configurar [`/specs/database.md`](../specs/database.md) para base de datos
3. Implementar [`/specs/components.md`](../specs/components.md) para UI

## Soporte

- Issues: GitHub Issues
- Documentación: `/specs/`
- Tests: `pnpm run test:e2e:dev`
