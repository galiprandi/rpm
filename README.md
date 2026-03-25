This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# RPM Accesorios

Sistema de administración para RPM Accesorios con autenticación Google OAuth y panel de administración.

## 🚀 Características

- **Autenticación Google OAuth** con Better Auth
- **Panel de administración** con sidebar colapsable
- **Base de datos PostgreSQL** con migraciones automáticas
- **Tema oscuro** responsive
- **Next.js 16+** con App Router
- **TypeScript** estricto

## 📁 Estructura del Proyecto

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rutas de autenticación
│   │   └── login/         # Página de login
│   ├── adm/               # Panel de administración
│   │   ├── layout.tsx     # Layout con sidebar
│   │   └── page.tsx       # Dashboard
│   └── api/               # API routes
│       └── auth/          # Endpoints de Better Auth
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes UI básicos
│   └── sidebar.tsx       # Sidebar del admin
├── lib/                  # Utilidades y configuración
│   ├── auth-client.ts    # Cliente Better Auth
│   └── prisma.ts         # Cliente Prisma
├── prisma/               # Base de datos
│   ├── schema.prisma     # Schema Prisma
│   └── migrations/       # Migraciones automáticas
├── specs/                # Especificaciones del sistema
└── docs/                 # Documentación técnica
```

## 🛠️ Setup Local

### Prerrequisitos

- Node.js 18+
- pnpm
- PostgreSQL (o Docker)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/galiprandi/rpm.git
cd rpm

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
```

### Variables de Entorno

```bash
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/rpm_dev"
BETTER_AUTH_SECRET="your-secret-here"
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_URL="http://localhost:3000"
```

### Base de Datos

```bash
# Iniciar PostgreSQL con Docker
pnpm db:start

# O usar PostgreSQL local
# Asegurar que la base de datos exista
createdb rpm_dev

# Aplicar migraciones
npx prisma migrate deploy

# Generar cliente Prisma
pnpm db:generate
```

### Ejecutar

```bash
# Modo desarrollo
pnpm dev

# Build producción
pnpm build

# Iniciar producción
pnpm start
```

## 🏗️ Arquitectura

### Autenticación

- **Better Auth** para autenticación
- **Google OAuth** como proveedor
- **Sesiones** con cookies seguras
- **Middleware** para protección de rutas

### Layout

- **AdminLayout** (`app/adm/layout.tsx`) - Layout principal
- **Sidebar** colapsable con logout
- **Dashboard** minimalista
- **Responsive** con tema oscuro

### Base de Datos

- **Prisma** como ORM
- **PostgreSQL** como motor
- **Migraciones automáticas** en deploy
- **Better Auth adapter** para integración

## 📚 Documentación

### Especificaciones
- [`specs/layout.md`](./specs/layout.md) - Layout y componentes
- [`specs/auth.md`](./specs/auth.md) - Autenticación
- [`specs/api.md`](./specs/api.md) - API endpoints

### Guías Técnicas
- [`docs/database-migrations.md`](./docs/database-migrations.md) - Migraciones de BD
- [`docs/ci-cd.md`](./docs/ci-cd.md) - CI/CD y deploy
- [`docs/monitoring.md`](./docs/monitoring.md) - Monitoreo

## 🔄 Flujo de Trabajo

### Desarrollo

1. **Crear feature branch**
```bash
git checkout -b feature/nueva-funcionalidad
```

2. **Desarrollar cambios**
```bash
# Modificar schema si es necesario
npx prisma migrate dev --name feature

# Probar cambios
pnpm dev
```

3. **Testing**
```bash
# Tests unitarios
pnpm test

# Tests E2E
pnpm test:e2e

# Type checking
pnpm type-check
```

4. **Deploy automático**
```bash
git push origin feature/nueva-funcionalidad
# Crear PR → Merge → Deploy automático
```

### Migraciones

**Nueva tabla/campo:**
```bash
# 1. Modificar schema.prisma
# 2. Crear migración
npx prisma migrate dev --name nueva_tabla

# 3. Probar localmente
pnpm dev

# 4. Commit y push (auto-aplica en producción)
git add prisma/migrations/
git commit -m "feat: add nueva_tabla"
git push
```

## 🚀 Deploy

### Producción (Vercel)

```bash
# Deploy manual
pnpm deploy:prod

# Variables de entorno en Vercel
vercel env ls
```

**Build process automático:**
1. `npx prisma migrate deploy` - Aplica migraciones
2. `next build` - Build aplicación
3. Deploy - Despliegue automático

### Environment Variables

**Producción (Vercel):**
- `DATABASE_URL` - PostgreSQL connection
- `BETTER_AUTH_SECRET` - Auth secret
- `BETTER_AUTH_URL` - `https://rpm-wheat.vercel.app`
- `GOOGLE_CLIENT_ID` - Google OAuth client
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `NEXT_PUBLIC_URL` - `https://rpm-wheat.vercel.app`

## 🧪 Testing

### Unit Tests
```bash
pnpm test              # Ejecutar todos
pnpm test:ui           # UI interactiva
pnpm test:coverage     # Con cobertura
```

### E2E Tests
```bash
pnpm test:e2e          # Playwright
pnpm test:e2e:dev      # Modo desarrollo
pnpm test:e2e:debug    # Debug mode
```

### Database Testing
```bash
pnpm db:health         # Health check local
pnpm db:health:prod    # Health check producción
pnpm db:validate       # Validar conexión
```

## 🔧 Troubleshooting

### Issues Comunes

**Autenticación no funciona:**
```bash
# Verificar variables de entorno
vercel env ls

# Revisar logs de Vercel
vercel logs

# Probar auth endpoint
curl https://rpm-wheat.vercel.app/api/auth/ok
```

**Migraciones fallan:**
```bash
# Revisar estado de migraciones
npx prisma migrate status

# Aplicar manualmente
npx prisma migrate deploy

# Reset si es necesario
npx prisma migrate reset --force
```

**Build falla:**
```bash
# Limpiar cache
rm -rf .next
pnpm install

# Revisar TypeScript
pnpm type-check
```

### Debug Mode

```bash
# Ver logs detallados
DEBUG=* pnpm dev

# Logs de Prisma
DEBUG=prisma:* pnpm dev

# Logs de Better Auth
BETTER_AUTH_DEBUG=true pnpm dev
```

## 📊 Monitoreo

### Health Checks

- **Database:** `/api/health/db`
- **Auth:** `/api/auth/ok`
- **Application:** `/`

### Métricas

- **Response time** - API endpoints
- **Database connections** - Pool status
- **Error rate** - 4xx/5xx tracking
- **Migration status** - Applied/pending

## 🤝 Contribuir

1. **Fork** el repositorio
2. **Branch** para feature (`git checkout -b feature/amazing-feature`)
3. **Commit** cambios (`git commit -m 'feat: add amazing feature'`)
4. **Push** al branch (`git push origin feature/amazing-feature`)
5. **PR** a main

### Code Style

- **TypeScript** estricto
- **ESLint** configurado
- **Prettier** para formato
- **Conventional Commits** para mensajes

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

---

**Desarrollado con ❤️ para RPM Accesorios**.
