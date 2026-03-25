# Database Setup Guide - RPM Accesorios

## Overview

Configuración completa de base de datos PostgreSQL para desarrollo local y producción en Vercel.

## Development Setup

### 1. Iniciar PostgreSQL Local
```bash
# Iniciar Docker con PostgreSQL
pnpm run db:start

# Esperar 15 segundos para que la base de datos esté lista
sleep 15

# Generar Prisma client
pnpm run db:generate

# Probar conexión
pnpm run test tests/db.test.ts
```

### 2. Scripts de Desarrollo
```bash
pnpm run db:start      # Iniciar PostgreSQL
pnpm run db:stop       # Detener PostgreSQL
pnpm run db:reset      # Resetear base de datos
pnpm run db:logs       # Ver logs de PostgreSQL
pnpm run db:studio     # Abrir Prisma Studio
pnpm run db:generate   # Generar Prisma client
pnpm run db:migrate    # Ejecutar migrations
pnpm run db:seed       # Ejecutar seed scripts
```

### 3. Environment Variables (Development)
```bash
# .env.local
DATABASE_URL="postgresql://rpm_user:rpm_password@localhost:5432/rpm_dev?schema=public"
```

## Production Setup (Vercel)

### 1. Variables de Entorno Configuradas
Las siguientes variables ya están configuradas en Vercel:

- `DATABASE_URL` - Conexión principal a PostgreSQL
- `POSTGRES_URL` - URL de conexión con pooling
- `POSTGRES_PRISMA_URL` - URL específica para Prisma
- `POSTGRES_URL_NON_POOLING` - URL sin pooling

### 2. Verificar Configuración
```bash
# Listar variables de entorno
vercel env ls

# Ver detalles del proyecto
vercel projects
```

### 3. Deploy con Base de Datos
```bash
# Deploy a producción
pnpm run build
vercel --prod

# O usar el script
pnpm run deploy
```

## Health Check

### Development
```bash
# Iniciar servidor
pnpm run dev

# Probar health check
curl http://localhost:3000/api/health/db
```

### Production
```bash
# Probar health check en producción
curl https://rpm-wheat.vercel.app/api/health/db
```

**Response esperado:**
```json
{
  "status": "healthy",
  "database": "postgresql",
  "connections": 1,
  "timestamp": "2026-03-25T05:51:27.072Z"
}
```

## Prisma Studio

### Development
```bash
# Abrir Prisma Studio
pnpm run db:studio
# Acceder a http://localhost:5555
```

### Production
Prisma Studio no está disponible en producción por seguridad. Usa el dashboard de Vercel para gestionar la base de datos.

## Migration Strategy

### Development
```bash
# Crear nueva migration
npx prisma migrate dev --name add_users_table

# Resetear base de datos (development only)
npx prisma migrate reset

# Generar client después de cambios
pnpm run db:generate
```

### Production
```bash
# Deploy migrations a producción
npx prisma migrate deploy

# Generar client para producción
pnpm run db:generate
```

## Troubleshooting

### Database Connection Issues

#### Development
```bash
# Verificar que Docker está corriendo
docker ps

# Ver logs de PostgreSQL
pnpm run db:logs

# Reiniciar base de datos
pnpm run db:reset
```

#### Production
```bash
# Verificar variables de entorno
vercel env ls

# Ver logs de deploy
vercel logs

# Re-deploy con variables actualizadas
vercel --prod
```

### Common Errors

**"Database connection failed"**
- Verificar DATABASE_URL configurada
- Asegurar que Docker está corriendo (development)
- Verificar variables de entorno en Vercel (production)

**"Prisma client not generated"**
- Ejecutar `pnpm run db:generate`
- Verificar que schema.prisma es válido

**"Migration failed"**
- Asegurar que la base de datos está accesible
- Verificar sintaxis del schema
- Resetear en development si es necesario

## Performance Considerations

### Connection Pooling
- **Development**: Conexión directa sin pooling
- **Production**: Connection pooling automático de Vercel

### Monitoring
- Health checks automáticos via `/api/health/db`
- Logs de Prisma en development
- Métricas de Vercel en producción

## Security

### Environment Variables
- Nunca commitear `.env.local`
- Usar variables encriptadas en Vercel
- Rotar credenciales regularmente

### Access Control
- Principio de mínimo privilegio
- Sin acceso directo a producción localmente
- Usar Vercel dashboard para gestión

## Backup Strategy

### Development
```bash
# Backup manual
docker exec rpm-postgres pg_dump -U rpm_user rpm_dev > backup.sql

# Restore
docker exec -i rpm-postgres psql -U rpm_user rpm_dev < backup.sql
```

### Production
- **Automated**: Backups diarios de Vercel
- **Manual**: Via dashboard de Vercel
- **Point-in-time**: 7 días de retención

## Next Steps

1. **Implementar auth.md** - Agregar tablas `User` y `Session`
2. **Implementar products.md** - Agregar tabla `Product`
3. **Implementar orders.md** - Agregar tablas `Order` y `OrderItem`

Cada especificación agregará sus propias tablas al schema base existente.
