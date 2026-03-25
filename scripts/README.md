# Database Scripts - RPM Accesorios

## 📋 Available Scripts

### 🚀 setup-db-env.sh
**Purpose**: Configura automáticamente las variables de entorno de Vercel para la base de datos.

**⚠️ SECURITY WARNING**: 
- **NEVER** hardcode credentials in this script
- **ALWAYS** use environment variables
- **NEVER** commit real credentials to git

**Usage**:
```bash
# Set environment variable with your database URL
export POSTGRES_URL="postgres://user:password@host:port/db?sslmode=require"

# Run the script
./scripts/setup-db-env.sh
```

**What it does**:
- Lee variables de entorno (NO hardcodea credenciales)
- Crea/actualiza las 4 variables de entorno de PostgreSQL en Vercel
- Configura variables para producción

**When to use**:
- Después de crear una nueva base de datos en Vercel
- Si necesitas actualizar las URLs de conexión
- Para setup inicial del proyecto

---

### 🚀 deploy-with-db.sh
**Purpose**: Deploy completo con validación de base de datos.

**Usage**:
```bash
pnpm run deploy
# o
./scripts/deploy-with-db.sh
```

**What it does**:
1. Build del proyecto
2. Genera Prisma client
3. Deploy a Vercel
4. Valida health check de producción
5. Muestra resultados

**When to use**:
- Deploy normal a producción
- Después de cambios en el schema
- Para validar que la DB está funcionando

---

## 🔧 Quick Commands

### Setup Inicial
```bash
# 1. Configurar variables de Vercel
pnpm run db:setup

# 2. Iniciar base de datos local
pnpm run db:start

# 3. Esperar y generar client
sleep 15 && pnpm run db:generate

# 4. Validar conexión
pnpm run test tests/db.test.ts
```

### Deploy a Producción
```bash
# Deploy completo con validación
pnpm run deploy

# Solo deploy sin validación
pnpm run deploy:prod
```

### Health Checks
```bash
# Local (necesita servidor corriendo)
pnpm run db:health

# Producción
pnpm run db:health:prod
```

## 🚨 Important Notes

### Environment Variables
- Los scripts usan URLs hardcodeadas de Prisma Postgres
- Si cambias la base de datos, actualiza los scripts
- Las variables se encriptan automáticamente en Vercel

### Prisma Client
- Siempre genera el client después de cambios en el schema
- Usa `pnpm run db:generate` o `npx prisma generate`
- El client se genera en `./generated/`

### Health Checks
- Local: `http://localhost:3000/api/health/db`
- Producción: `https://rpm-wheat.vercel.app/api/health/db`
- Debug: `https://rpm-wheat.vercel.app/api/debug/env`

## 🔄 Troubleshooting

### "Variables not found"
```bash
# Re-configurar variables
pnpm run db:setup

# Verificar configuración
vercel env ls
```

### "Deploy failed"
```bash
# Verificar build local
pnpm run build

# Verificar Prisma client
pnpm run db:generate

# Re-deploy
pnpm run deploy
```

### "Database connection failed"
```bash
# Local:
pnpm run db:logs
pnpm run db:reset

# Producción:
pnpm run db:health:prod
pnpm run deploy
```

## 📚 Related Documentation

- [Database Setup Guide](../docs/database-setup.md)
- [Database Quick Reference](../docs/database-quick-reference.md)
- [Database Specification](../specs/database.md)
- [Prisma Documentation](https://www.prisma.io/docs)

## 🛠️ Script Requirements

### Dependencies
- Vercel CLI (`vercel`)
- Docker & Docker Compose
- Prisma CLI (`npx prisma`)
- pnpm

### Permissions
- Scripts deben ser ejecutables: `chmod +x scripts/*.sh`
- Vercel CLI debe estar autenticado: `vercel login`

### Environment
- Node.js 24+
- PostgreSQL 15 (Docker)
- Prisma v7
