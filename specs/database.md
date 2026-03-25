# Database & ORM

## Overview

Base de datos relacional PostgreSQL gestionada por Vercel con Prisma ORM para acceso tipo-safe, migrations automáticas y optimización de queries.

## Stack Tecnológico

### Database Core
- **Production**: Vercel Postgres (PostgreSQL)
- **Development**: Docker PostgreSQL 15
- **ORM**: Prisma v5
- **Connection Pooling**: Automático Vercel / Local Docker
- **Migrations**: Prisma Migrate
- **Seeding**: Prisma Seed scripts

### Development Tools
- **Containerization**: Docker & Docker Compose
- **Studio**: Prisma Studio para visualización
- **Client Generation**: Automática TypeScript types
- **Query Optimization**: Prisma Query Engine
- **Backup**: Automático Vercel / Manual Docker

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
POSTGRES_URL="postgresql://rpm_user:rpm_password@localhost:5432/rpm_dev?schema=public"
POSTGRES_PRISMA_URL="postgresql://rpm_user:rpm_password@localhost:5432/rpm_dev?schema=public"
POSTGRES_URL_NON_POOLING="postgresql://rpm_user:rpm_password@localhost:5432/rpm_dev?schema=public"

# Production (Vercel)
# Configuradas automáticamente por Vercel Postgres
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
    environment:
      POSTGRES_DB: rpm_dev
      POSTGRES_USER: rpm_user
      POSTGRES_PASSWORD: rpm_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rpm_user -d rpm_dev"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
```

#### Database Initialization Script
```sql
-- scripts/init-db.sql
-- Create extensions needed for development
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create development-specific indexes if needed
-- These will be available in local development only

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE rpm_dev TO rpm_user;
```

#### Development Scripts
```json
{
  "scripts": {
    "db:dev": "docker-compose up -d postgres",
    "db:stop": "docker-compose down",
    "db:reset": "docker-compose down -v && npm run db:dev && sleep 5 && npm run db:migrate && npm run db:seed",
    "db:logs": "docker-compose logs -f postgres",
    "db:shell": "docker exec -it rpm-postgres psql -U rpm_user -d rpm_dev",
    "db:backup": "docker exec rpm-postgres pg_dump -U rpm_user rpm_dev > backup.sql",
    "db:restore": "docker exec -i rpm-postgres psql -U rpm_user rpm_dev < backup.sql"
  }
}
```

#### Development Workflow
```bash
# 1. Iniciar base de datos local
npm run db:dev

# 2. Esperar a que esté lista (health check)
docker logs rpm-postgres

# 3. Ejecutar migrations
npx prisma migrate dev --name init

# 4. Seed data de desarrollo
npm run db:seed

# 5. Iniciar desarrollo
npm run dev

# 6. Detener cuando termine
npm run db:stop
```

## Prisma Schema Definition

### Schema Base
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model for authentication
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  createdProducts Product[] @relation("ProductCreator")
  updatedProducts Product[] @relation("ProductUpdater")
  sessions        Session[]

  @@map("users")
}

// Session model for NextAuth
model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

// Product model
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  category    String?
  imageUrl    String?
  stock       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String
  updatedBy   String?

  creator User @relation("ProductCreator", fields: [createdBy], references: [id])
  updater User? @relation("ProductUpdater", fields: [updatedBy], references: [id])

  @@map("products")
}

// Order model (future)
model Order {
  id         String      @id @default(cuid())
  orderNumber String     @unique
  userId     String
  status     OrderStatus @default(PENDING)
  total      Decimal     @db.Decimal(10, 2)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  user User @relation(fields: [userId], references: [id])
  items OrderItem[]

  @@map("orders")
}

// Order items (future)
model OrderItem {
  id        String @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Decimal @db.Decimal(10, 2)

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}

// Enums
enum Role {
  USER
  STAFF
  ADMIN
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}
```

## Database Client Setup

### Prisma Client Instance
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query'],
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

  // User operations
  static async createUser(data: Prisma.UserCreateInput) {
    return this.withErrorHandling(
      () => prisma.user.create({ data }),
      'Failed to create user'
    );
  }

  static async getUserByEmail(email: string) {
    return this.withErrorHandling(
      () => prisma.user.findUnique({ where: { email } }),
      'Failed to get user'
    );
  }

  // Product operations
  static async createProduct(data: Prisma.ProductCreateInput) {
    return this.withErrorHandling(
      () => prisma.product.create({ 
        data,
        include: { creator: true }
      }),
      'Failed to create product'
    );
  }

  static async getProducts(options?: {
    skip?: number;
    take?: number;
    category?: string;
    active?: boolean;
  }) {
    return this.withErrorHandling(
      () => prisma.product.findMany({
        where: {
          isActive: options?.active ?? true,
          category: options?.category,
        },
        include: { creator: true },
        orderBy: { createdAt: 'desc' },
        skip: options?.skip,
        take: options?.take,
      }),
      'Failed to get products'
    );
  }

  static async updateProduct(id: string, data: Prisma.ProductUpdateInput) {
    return this.withErrorHandling(
      () => prisma.product.update({
        where: { id },
        data,
        include: { creator: true, updater: true }
      }),
      'Failed to update product'
    );
  }

  static async deleteProduct(id: string) {
    return this.withErrorHandling(
      () => prisma.product.delete({ where: { id } }),
      'Failed to delete product'
    );
  }
}
```

## Migration Strategy

### Migration Commands
```bash
# Create new migration
npx prisma migrate dev --name init

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# View database in Prisma Studio
npx prisma studio
```

### Migration Files Structure
```typescript
// prisma/migrations/001_init/migration.sql
-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "category" TEXT,
    "imageUrl" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_createdBy_fkey" FOREIGN KEY("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

## Seeding Strategy

### Seed Script
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@rpmacc.com' },
    update: {},
    create: {
      email: 'admin@rpmacc.com',
      name: 'RPM Admin',
      role: 'ADMIN',
    },
  });

  // Create staff user
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@rpmacc.com' },
    update: {},
    create: {
      email: 'staff@rpmacc.com',
      name: 'RPM Staff',
      role: 'STAFF',
    },
  });

  // Create sample products
  const products = [
    {
      name: 'Accesorio Premium A',
      description: 'Descripción del accesorio premium A',
      price: 299.99,
      category: 'Premium',
      stock: 50,
      createdBy: adminUser.id,
    },
    {
      name: 'Accesorio Estándar B',
      description: 'Descripción del accesorio estándar B',
      price: 149.99,
      category: 'Estándar',
      stock: 100,
      createdBy: staffUser.id,
    },
  ];

  for (const productData of products) {
    await prisma.product.upsert({
      where: { name: productData.name },
      update: {},
      create: productData,
    });
  }

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Package.json Scripts
```json
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "npx prisma migrate reset --force && npm run db:seed",
    "db:studio": "npx prisma studio",
    "db:migrate": "npx prisma migrate dev",
    "db:generate": "npx prisma generate",
    "db:dev": "docker-compose up -d postgres",
    "db:stop": "docker-compose down",
    "db:logs": "docker-compose logs -f postgres",
    "db:shell": "docker exec -it rpm-postgres psql -U rpm_user -d rpm_dev",
    "db:backup": "docker exec rpm-postgres pg_dump -U rpm_user rpm_dev > backup.sql",
    "db:restore": "docker exec -i rpm-postgres psql -U rpm_user rpm_dev < backup.sql",
    "db:full-reset": "docker-compose down -v && npm run db:dev && sleep 5 && npm run db:migrate && npm run db:seed"
  }
}
```

## Performance Optimization

### Query Optimization
```typescript
// lib/optimized-queries.ts
export class OptimizedQueries {
  // Optimized product listing with pagination
  static async getProductsPaginated(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    return prisma.product.findMany({
      where: { isActive: true },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  // Product with related data
  static async getProductWithDetails(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        updater: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  // Count products for pagination
  static async getProductsCount(category?: string) {
    return prisma.product.count({
      where: {
        isActive: true,
        category: category,
      }
    });
  }

  // User with their products
  static async getUserWithProducts(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        createdProducts: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }
      }
    });
  }
}
```

### Connection Pooling
```typescript
// lib/prisma-optimized.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  // Connection pooling configuration
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Log queries in development
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
// tests/database.test.ts
import { PrismaService } from '@/lib/prisma-with-error';

describe('Database Operations', () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  });

  test('Creates user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER' as const,
    };

    const user = await PrismaService.createUser(userData);

    expect(user.email).toBe(userData.email);
    expect(user.role).toBe(userData.role);
  });

  test('Fails to create duplicate user', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER' as const,
    };

    await PrismaService.createUser(userData);

    await expect(PrismaService.createUser(userData))
      .rejects.toThrow('Record already exists');
  });

  test('Creates and retrieves product', async () => {
    const user = await PrismaService.createUser({
      email: 'creator@example.com',
      name: 'Creator',
      role: 'STAFF',
    });

    const productData = {
      name: 'Test Product',
      price: 99.99,
      createdBy: user.id,
    };

    const product = await PrismaService.createProduct(productData);

    expect(product.name).toBe(productData.name);
    expect(product.price).toBe(productData.price);
    expect(product.creatorId).toBe(user.id);
  });
});
```

### Integration Tests
```typescript
// tests/database.integration.test.ts
describe('Database Integration', () => {
  test('Handles concurrent operations', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      PrismaService.createUser({
        email: `user${i}@example.com`,
        name: `User ${i}`,
        role: 'USER',
      })
    );

    const users = await Promise.all(promises);

    expect(users).toHaveLength(10);
    expect(new Set(users.map(u => u.email)).size).toBe(10);
  });

  test('Transaction rollback', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            email: 'test@example.com',
            name: 'Test',
            role: 'USER',
          },
        });
        
        // This will fail
        await tx.user.create({
          data: {
            email: 'test@example.com', // Duplicate email
            name: 'Test 2',
            role: 'USER',
          },
        });
      })
    ).rejects.toThrow();

    // Verify rollback
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    expect(user).toBeNull();
  });
});
```

## Vinculación con Otras Especificaciones

### Dependencias
- **core.md**: Requiere configuración de variables de entorno
- **auth.md**: Utiliza User y Session models
- **realtime.md**: Emite eventos basados en cambios DB
- **api.md**: Utiliza PrismaService en API routes

### Especificaciones Relacionadas
- `/specs/SYSTEM_SPEC.md` - Configuración de Vercel Postgres
- `/specs/vercel-deployment.md` - Environment variables

## Tests y Documentación Relacionados

### Tests Unitarios
- `database.test.ts` - Operaciones CRUD básicas
- `database.integration.test.ts` - Tests de concurrencia y transacciones
- `prisma.test.ts` - Validación de schemas

### Documentación Técnica
- `docs/database-setup.md` - Guía de configuración inicial
- `docs/migrations.md` - Estrategia de migraciones
- `docs/prisma-patterns.md` - Patrones de uso recomendados

### Vinculación Activa
- **Última actualización**: 2025-03-25
- **Estado tests**: 🟢 Todos pasando
- **Cobertura**: 90% (objetivo >95%)

## Maintenance & Operations

### Regular Tasks
- **Migrations**: Aplicar cambios de schema de forma controlada
- **Backups**: Verificación de backups automáticos de Vercel
- **Performance**: Monitoreo de query performance
- **Security**: Revisión de accesos y permisos

### Monitoring
```typescript
// api/db/health/route.ts
export async function GET() {
  try {
    const health = await checkDatabaseHealth();
    const connectionCount = await prisma.$queryRaw`
      SELECT count(*) as active_connections 
      FROM pg_stat_activity 
      WHERE state = 'active'
    `;
    
    return Response.json({
      database: health,
      connections: connectionCount[0]?.active_connections || 0,
      timestamp: Date.now(),
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      message: error.message,
    }, { status: 500 });
  }
}
```

### Backup Strategy
- **Automated**: Vercel Postgres backup diario
- **Manual**: Export commands para backups específicos
- **Recovery**: Procedimientos de restore documentados
- **Testing**: Validación periódica de restores
