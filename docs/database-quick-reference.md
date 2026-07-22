# Database Quick Reference - RPM Accesorios

## 🚀 Quick Start Commands

### Development (Local)
```bash
# Iniciar base de datos local
pnpm run db:start

# Esperar a que esté lista
sleep 15

# Generar Drizzle client
pnpm run db:generate

# Probar conexión
pnpm run test tests/db.test.ts

# Abrir Drizzle Studio
pnpm run db:studio

# Detener base de datos
pnpm run db:stop
```

### Production (Vercel)
```bash
# Deploy con base de datos
pnpm run deploy

# Verificar health check
curl https://rpm-wheat.vercel.app/api/health/db

# Debug de variables
curl https://rpm-wheat.vercel.app/api/debug/env
```

## 📋 Environment Variables

### Development (.env.local)
```bash
DATABASE_URL="postgresql://rpm_user:rpm_password@localhost:5432/rpm_dev?schema=public"
```

### Production (Vercel)
```bash
POSTGRES_URL="postgres://[user]:[password]@db.prisma.io:5432/postgres?sslmode=require"
DATABASE_URL="postgres://[user]:[password]@db.prisma.io:5432/postgres?sslmode=require"
POSTGRES_URL_NON_POOLING="postgres://[user]:[password]@db.prisma.io:5432/postgres?sslmode=require"
```

## 🔧 Database Operations

### Migrations (cuando agregues tablas)
```bash
# Crear nueva migration
pnpm db:generate && pnpm db:migrate

# Deploy migrations a producción
pnpm db:migrate

# Resetear base de datos (development only)
# ⚠️ Prohibido reset de la base de datos en este proyecto
```

### Schema Management
```bash
# Generar client (después de cambios)
pnpm run db:generate
```

## 🏥 Health Monitoring

### Local Health Check
```bash
# Iniciar servidor
pnpm run dev

# Probar health check
curl http://localhost:3000/api/health/db
```

### Production Health Check
```bash
curl https://rpm-wheat.vercel.app/api/health/db
```

**Response esperado:**
```json
{
  "status": "healthy",
  "database": "postgresql",
  "connections": 1,
  "timestamp": "2026-03-25T06:15:00.946Z"
}
```

## 🛠️ Troubleshooting

### Common Issues

#### "Database connection failed"
```bash
# Development:
pnpm run db:logs
pnpm run db:reset

# Production:
vercel env ls
pnpm run deploy
```

#### "Drizzle client not generated"
```bash
pnpm run db:generate
```

#### "Migration failed"
```bash
# Verificar conexión
pnpm run test tests/db.test.ts

# Re-deploy en producción
pnpm run deploy
```

### Debug Commands
```bash
# Ver variables de entorno
curl https://rpm-wheat.vercel.app/api/debug/env

# Ver logs de Docker
pnpm run db:logs

# Ver logs de Vercel
vercel logs
```

## 📊 Performance Monitoring

### Connection Stats
```bash
# Production connections
curl https://rpm-wheat.vercel.app/api/health/db | jq '.connections'

# Local connections
curl http://localhost:3000/api/health/db | jq '.connections'
```

### Query Debugging
```bash
# Habilitar query logs (development)
# Edit lib/db.ts y asegurar que 'query' esté en el array log

# Ver queries en tiempo real
pnpm run db:logs
```

## 🔄 Environment Switching

### Local → Production
```bash
# 1. Commit changes
git add .
git commit -m "db: changes ready for production"

# 2. Deploy
pnpm run deploy

# 3. Verify
curl https://rpm-wheat.vercel.app/api/health/db
```

### Production → Local
```bash
# 1. Pull latest changes
git pull main

# 2. Start local DB
pnpm run db:start

# 3. Generate client
pnpm run db:generate

# 4. Test
pnpm run test tests/db.test.ts
```

## 📝 Adding New Tables

Cuando implementes una nueva especificación (auth.md, products.md, etc.):

### 1. Update Schema
```typescript
// db/schema/schema.ts
export const newModel = pgTable('new_model', {
  id: text('id').primaryKey().$defaultFn(() => cuid()),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});
```

### 2. Create Migration
```bash
pnpm db:generate && pnpm db:migrate
```

### 3. Update Tests
```typescript
// tests/db.test.ts
it('should query new model', async () => {
  const result = await db.select().from(newModel);
  expect(Array.isArray(result)).toBe(true);
});
```

### 4. Deploy
```bash
pnpm run deploy
```

## 🚨 Emergency Procedures

### Database Reset (Development)
```bash
# ⚠️ This will delete all local data
pnpm run db:reset
pnpm run db:generate
pnpm run test tests/db.test.ts
```

### Production Rollback
```bash
# Deploy previous version
vercel rollback [previous-deployment-url]

# Verify health
curl https://rpm-wheat.vercel.app/api/health/db
```

### Access Production Database
```bash
# Via Vercel Dashboard
# 1. Go to https://vercel.com/rpmsysadim-5965s-projects/rpm
# 2. Storage → Postgres → rpm-db
# 3. Connect with provided tools

# Via Drizzle Studio (development only)
pnpm run db:studio
```

## 📚 Useful Links

- **Vercel Dashboard**: https://vercel.com/rpmsysadim-5965s-projects/rpm
- **Production App**: https://rpm-wheat.vercel.app
- **Health Check**: https://rpm-wheat.vercel.app/api/health/db
- **Drizzle ORM Docs**: https://orm.drizzle.team/docs/overview
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

## 🔄 Scripts Reference

| Script | Description | Environment |
|--------|-------------|-------------|
| `pnpm run db:start` | Iniciar PostgreSQL local | Development |
| `pnpm run db:stop` | Detener PostgreSQL local | Development |
| `pnpm run db:studio` | Abrir Drizzle Studio | Development |
| `pnpm run db:generate` | Generar Drizzle client | Both |
| `pnpm run db:migrate` | Crear migration | Development |
| `pnpm run db:deploy` | Deploy migrations | Production |
| `pnpm run deploy` | Deploy completo | Production |
| `./scripts/setup-db-env.sh` | Configurar variables Vercel | Production |
| `./scripts/deploy-with-db.sh` | Deploy con validación | Production |
