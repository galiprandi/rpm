🟢 # Database & ORM Configuration

## Overview

Configuración de base de datos PostgreSQL con Prisma ORM para desarrollo local (Docker) y producción (Vercel). Las tablas se crearán bajo demanda según las necesidades de cada especificación.

## Stack Tecnológico

### Database Core
- **Production**: Prisma Postgres (Free Tier)
- **Development**: Docker PostgreSQL 15
- **ORM**: Prisma v7
- **Adapter**: @prisma/adapter-pg
- **Connection Pooling**: Automático Vercel / Local Docker
- **Migrations**: Prisma Migrate (bajo demanda)
- **Seeding**: Prisma Seed scripts (bajo demanda)

### Development Tools
- **Containerization**: Docker & Docker Compose
- **Studio**: Prisma Studio para visualización
- **Client Generation**: Automática TypeScript types
- **Query Optimization**: Prisma Query Engine
- **Backup**: Automático Vercel / Manual Docker

## 🔄 Importador de Productos - Impacto en Database

### Consideraciones Críticas

**⚠️ IMPORTANTE**: Cualquier cambio en el modelo de productos o categorías requiere adaptaciones en múltiples partes del sistema:

1. **Schema Prisma** - Modificar modelos `Product` y `Category`
2. **API Endpoints** - Actualizar `/api/import/products/*`
3. **Transformadores** - Ajustar funciones de mapeo en `lib/transformers.ts`
4. **Validaciones** - Actualizar schemas Zod en `lib/product-import-schemas.ts`
5. **UI Components** - Modificar `ColumnMapper.tsx` y campos disponibles
6. **Tests** - Actualizar mocks y expected values

### Modelo Product - Campos Importables

```prisma
model Product {
  id          String   @id @default(uuid())
  sku         String?  @unique
  name        String
  description String?
  costPrice   Decimal  @db.Decimal(10, 2)
  salePrice   Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  minStock    Int      @default(0)
  barcode     String?
  location    String?
  categoryId  String
  supplier    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  category    Category @relation(fields: [categoryId], references: [id])
  workOrderItems WorkOrderItem[]
  invoiceItems InvoiceItem[]
  serviceKits ServiceKit[]

  @@index([categoryId])
  @@index([stock, minStock])
  @@index([sku])
  @@map("products")
}
```

### Batch Processing Strategy

```typescript
// Configuración para importación masiva
const IMPORT_BATCH_CONFIG = {
  // Tamaño del lote para no saturar la DB
  chunkSize: 100,
  
  // Transacciones por lote
  maxRetries: 3,
  transactionTimeout: 30000,
  
  // Optimizaciones Prisma
  selectFields: {
    id: true,
    sku: true,
    name: true,
    categoryId: true
  }
};

// Estrategia de inserción
async function batchImport(products: ProductInput[]) {
  const results = [];
  
  for (const chunk of chunkArray(products, 100)) {
    try {
      // Usar createMany para mejor performance
      const result = await prisma.product.createMany({
        data: chunk,
        skipDuplicates: true
      });
      
      results.push(result);
    } catch (error) {
      // Fallback a inserciones individuales si falla batch
      for (const product of chunk) {
        try {
          await prisma.product.create({ data: product });
        } catch (e) {
          // Log error y continuar
          console.error(`Failed to import ${product.sku}:`, e);
        }
      }
    }
  }
  
  return results;
}
```

### Índices Optimizados para Importación

```sql
-- Índices específicos para validación de duplicados
CREATE INDEX CONCURRENTLY idx_product_sku_name ON Product(sku, name) WHERE sku IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_product_category_active ON Product(categoryId, isActive) WHERE isActive = true;

-- Índices para búsquedas durante importación
CREATE INDEX CONCURRENTLY idx_product_barcode ON Product(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_category_name_lower ON Category(LOWER(name));

-- Índice compuesto para stock management
CREATE INDEX CONCURRENTLY idx_product_stock_category ON Product(stock, categoryId) WHERE isActive = true;
```

### Consideraciones de Performance

```typescript
// Límites para prevenir timeouts
const IMPORT_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxRowsPerFile: 50000,         // 50k filas
  maxBatchSize: 100,             // Productos por lote
  maxConcurrentImports: 3,        // Importaciones simultáneas
  queryTimeout: 30000            // 30s por query
};

// Monitoreo de recursos
interface ImportMetrics {
  dbConnections: number;    // Conexiones activas
  memoryUsage: number;      // MB usados
  queryTime: number;        // Tiempo promedio queries
  errorsPerBatch: number;   // Errores por lote
}
```

### Validaciones a Nivel de Base de Datos

```sql
-- Constraints para integridad de datos
ALTER TABLE Product 
ADD CONSTRAINT chk_product_price_positive 
CHECK (costPrice >= 0 AND salePrice >= 0);

ALTER TABLE Product 
ADD CONSTRAINT chk_product_stock_positive 
CHECK (stock >= 0 AND minStock >= 0);

ALTER TABLE Product 
ADD CONSTRAINT chk_product_margin_reasonable 
CHECK (salePrice >= costPrice OR costPrice = 0);

-- Trigger para auditoría de importaciones
CREATE OR REPLACE FUNCTION log_product_import()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO import_logs(table_name, operation, record_id, timestamp)
  VALUES ('products', 'INSERT', NEW.id, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_import_audit
AFTER INSERT ON Product
FOR EACH ROW
EXECUTE FUNCTION log_product_import();
```

## Vercel Postgres Configuration

### Database Setup
```typescript
// Vercel Postgres Configuration
- Provider: PostgreSQL
- Region: Automatic (nearest to deployment)
- Plan: Free/Pro tier según necesidades
- Connection: Connection pooling automático
- Backup: Daily backups automáticos
```

### Environment Variables
```bash
# .env.local (development) - Docker PostgreSQL
DATABASE_URL="postgresql://rpm_user:rpm_password@localhost:5432/rpm_dev?schema=public"

# Production (Vercel) - Prisma Postgres
# ⚠️ SECURITY: Never hardcode credentials in code!
# Use environment variables or Vercel dashboard
POSTGRES_URL="postgres://[user]:[password]@db.prisma.io:5432/postgres?sslmode=require"
DATABASE_URL="postgres://[user]:[password]@db.prisma.io:5432/postgres?sslmode=require"
POSTGRES_PRISMA_URL="postgres://[user]:[password]@db.prisma.io:5432/postgres?sslmode=require"
POSTGRES_URL_NON_POOLING="postgres://[user]:[password]@db.prisma.io:5432/postgres?sslmode=require"
```

#### Secure Setup
```bash
# Set environment variables before running setup script
export POSTGRES_URL="postgres://user:password@host:port/db?sslmode=require"
./scripts/setup-db-env.sh

# Or configure via Vercel dashboard
vercel open  # → Storage → Postgres → rpm-db
```

### Docker Development Setup

#### Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: rpm-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: rpm_dev
      POSTGRES_USER: rpm_user
      POSTGRES_PASSWORD: rpm_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rpm_user -d rpm_dev"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
```

#### Development Scripts
```json
{
  "scripts": {
    "db:start": "docker-compose up -d postgres",
    "db:stop": "docker-compose down",
    "db:reset": "docker-compose down -v && docker-compose up -d postgres",
    "db:logs": "docker-compose logs postgres",
    "db:studio": "npx prisma studio",
    "db:generate": "npx prisma generate",
    "db:migrate": "npx prisma migrate dev",
    "db:deploy": "npx prisma migrate deploy",
    "db:seed": "npx prisma db seed",
    "deploy": "./scripts/deploy-with-db.sh",
    "deploy:prod": "vercel --prod"
  }
}
```

#### Quick Setup Scripts
```bash
# Development setup completo
./scripts/setup-db-env.sh    # Configurar variables Vercel
pnpm run db:start           # Iniciar PostgreSQL local
sleep 15                    # Esperar que esté listo
pnpm run db:generate        # Generar Prisma client
pnpm run test tests/db.test.ts  # Validar conexión
```

#### Development Workflow
```bash
# 1. Iniciar PostgreSQL
npm run db:start

# 2. Esperar a que esté listo (10-15 segundos)
sleep 15

# 3. Generar Prisma client (cuando haya schema)
npm run db:generate

# 4. Ejecutar migrations (cuando haya tablas)
npm run db:migrate

# 5. Seed data (cuando haya datos)
npm run db:seed

# 6. Iniciar desarrollo
npm run dev

# 7. Detener cuando termine
npm run db:stop
```

## Prisma Schema Configuration

### Schema Base (Sin Tablas)
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../generated"
}

datasource db {
  provider = "postgresql"
}

// Tables will be added here as needed
// Example: When implementing auth.md, add User and Session models
```

### Tab Strategy
- **On-demand creation**: Tables created when implementing specific features
- **Spec-driven**: Each spec adds its own tables
- **Minimal approach**: Only create tables when actually needed
- **Incremental**: Schema grows with application needs

## Database Client Setup

### Prisma Client Instance
```typescript
// lib/prisma.ts
import { PrismaClient } from '../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use different connection strings based on environment
const connectionString = process.env.NODE_ENV === 'production' 
  ? process.env.POSTGRES_URL || process.env.DATABASE_URL
  : process.env.DATABASE_URL;

// Create adapter for PostgreSQL
const adapter = new PrismaPg({
  connectionString,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Client with Error Handling
```typescript
// lib/prisma-with-error.ts
import { prisma } from './prisma';

export class PrismaService {
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Database operation failed'
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(errorMessage, error);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle known Prisma errors
        switch (error.code) {
          case 'P2002':
            throw new Error('Record already exists');
          case 'P2025':
            throw new Error('Record not found');
          default:
            throw new Error(`Database error: ${error.message}`);
        }
      }
      
      throw new Error(errorMessage);
    }
  }

  // Generic operations (will be expanded as tables are added)
  static async healthCheck() {
    return this.withErrorHandling(async () => {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date() };
    }, 'Database health check failed');
  }

  // Connection count (used in health check API)
  static async getConnectionCount() {
    return this.withErrorHandling(async () => {
      const result = await prisma.$queryRaw`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      ` as Array<{ active_connections: bigint }>;
      
      return Number(result[0]?.active_connections || 0);
    }, 'Connection count query failed');
  }
}
```

## Environment Configuration

### Development Environment
```bash
# .env.local
DATABASE_URL="postgresql://rpm_user:rpm_password@localhost:5432/rpm_dev?schema=public"
```

### Production Environment
```bash
# Configured by Vercel Postgres automatically
DATABASE_URL=${POSTGRES_URL}
```

### Validation Script
```typescript
// scripts/validate-db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test basic query
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database query successful');
    
  } catch (error) {
    console.error('❌ Database validation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

validateDatabase();
```

## Testing Strategy

### Database Testing Setup
```typescript
// tests/setup/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database if needed
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
```

### Test Scripts
```json
{
  "scripts": {
    "test:db": "npm run db:start && sleep 10 && npm run test:run && npm run db:stop",
    "test:db:unit": "vitest run --config vitest.config.db.ts",
    "test:db:e2e": "playwright test --config playwright.config.db.ts"
  }
}
```

## Performance Considerations

### Connection Pooling
- **Development**: Single connection (Docker)
- **Production**: Connection pooling (Vercel)
- **Optimization**: Query logging enabled in dev

### Monitoring
- **Query Performance**: Prisma query logs
- **Connection Health**: Health check endpoint
- **Error Tracking**: Structured error logging

## Security Best Practices

### Environment Variables
- Never commit `.env.local`
- Use Vercel secrets for production
- Rotate database credentials regularly

### Access Control
- Least privilege principle
- Read-only replicas for reporting
- Audit logging for sensitive operations

## Migration Strategy

### Development Migrations
```bash
# Create migration (when adding tables)
npx prisma migrate dev --name add_users

# Reset database (development only)
npx prisma migrate reset

# Generate client after schema changes
npx prisma generate
```

### Production Migrations
```bash
# Deploy migrations to production
npx prisma migrate deploy

# Generate client for production
npx prisma generate
```

## Backup and Recovery

### Development Backup
```bash
# Manual backup
docker exec rpm-postgres pg_dump -U rpm_user rpm_dev > backup.sql

# Restore backup
docker exec -i rpm-postgres psql -U rpm_user rpm_dev < backup.sql
```

### Production Backup
- **Automated**: Daily backups by Vercel
- **Manual**: On-demand through Vercel dashboard
- **Point-in-time**: 7-day retention

## Vinculación con Otras Especificaciones

### Especificaciones Relacionadas
- `/specs/auth.md` - Agregará tablas `User` y `Session`

### Flujo de Trabajo
1. **database.md** - Configuración base ✅
2. **auth.md** - Agrega tablas de autenticación

## Tests y Documentación Relacionados

### Tests Unitarios
- `db.test.ts` - Validación de conexión ✅ Implementado (6/6 pasando)
- `prisma.test.ts` - Tests de client ✅ Implementado (15/15 pasando)

### Tests E2E
- `db-connection.spec.ts` - Validación de conexión E2E ✅ Implementado

### Health Check API
- `/api/health/db` - Endpoint de validación de conexión ✅ Implementado
- `/api/debug/env` - Debug de variables de entorno ✅ Implementado

#### Health Check Endpoint
```typescript
// GET /api/health/db
// Response:
{
  "status": "healthy" | "unhealthy",
  "database": "postgresql",
  "connections": number,
  "timestamp": string,
  "error": string // solo si status es "unhealthy"
}
```

#### Usage Examples
```bash
# Local health check
curl http://localhost:3000/api/health/db

# Production health check  
curl https://rpm-wheat.vercel.app/api/health/db

# Expected healthy response
{
  "status": "healthy",
  "database": "postgresql", 
  "connections": 1,
  "timestamp": "2026-03-25T06:15:00.946Z"
}
```

### Documentación Técnica
- `docs/database-setup.md` - Guía completa de setup ✅ Implementado

### Vinculación Activa
- **Última actualización**: 2025-03-25
- **Estado**: ✅ Configuración base completa y funcionando
- **Tablas**: 0 (se crearán bajo demanda)
- **CI/CD**: ✅ Pipeline configurado para validación de DB
- **Producción**: ✅ Prisma Postgres funcionando
- **Local**: ✅ Docker PostgreSQL funcionando
- **Tests Unitarios**: ✅ 21/21 pasando (6 db + 15 prisma)
- **Tests E2E**: ✅ db-connection.spec.ts implementado
- **Health Check**: ✅ API funcionando en producción
- **Validación**: ✅ Script de validación automático

### Scripts de Automatización
- `scripts/setup-db-env.sh` - Configuración automática de variables Vercel
- `scripts/deploy-with-db.sh` - Deploy con validación de DB
- `scripts/validate-db.ts` - Validación completa de configuración de DB
- `pnpm run deploy` - Deploy completo con base de datos
- `pnpm run db:validate` - Validación de entorno y conexión

### Endpoints Disponibles
- `GET /api/health/db` - Health check de base de datos
  - **Response**: Status, connections, timestamp
  - **Usage**: `curl https://rpm-wheat.vercel.app/api/health/db`
- `GET /api/debug/env` - Debug de variables de entorno
  - **Response**: Variables cargadas y estado
  - **Usage**: `curl https://rpm-wheat.vercel.app/api/debug/env`

## Mantenimiento

### Regular Updates
- **Prisma**: Seguir releases estables
- **PostgreSQL**: Security patches
- **Dependencies**: Actualización mensual

### Monitoring
- **Connection Health**: Health checks automáticos
- **Performance**: Query optimization
- **Errors**: Structured logging
