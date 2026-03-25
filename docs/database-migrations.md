# Database Migrations Guide

## Overview

This guide covers database migrations for RPM Accesorios using Prisma Migrate. Migrations are automatically applied during deployment to ensure the database schema is always up to date.

## Migration Strategy

### Automatic Deploy Migrations

**Build Process:**
```json
{
  "scripts": {
    "build": "npx prisma migrate deploy && next build"
  }
}
```

**Deployment Flow:**
1. **Code pushed** → Vercel triggers build
2. **Prisma migrate deploy** → Applies pending migrations
3. **Next build** → Builds application
4. **Deploy** → Application deployed with updated schema

### Migration Files

**Location:** `prisma/migrations/`

**Structure:**
```
prisma/migrations/
├── 001_init_auth_tables/
│   └── migration.sql
├── 002_add_products/
│   └── migration.sql
└── ...
```

## Development Workflow

### Creating New Migrations

**1. Modify Schema:**
```prisma
// prisma/schema.prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  price       Decimal
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**2. Generate Migration:**
```bash
npx prisma migrate dev --name add_products
```

**3. Review Generated SQL:**
```sql
-- prisma/migrations/002_add_products/migration.sql
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
```

**4. Test Locally:**
```bash
npx prisma migrate dev
npm run dev
```

**5. Commit and Deploy:**
```bash
git add prisma/migrations/002_add_products/
git commit -m "feat: add products table"
git push origin main
```

## Production Deployment

### Automatic Application

Migrations are automatically applied during the Vercel build process:

```bash
# Vercel build command
npx prisma migrate deploy && next build
```

**Benefits:**
- **Zero downtime** - Migrations run before deployment
- **Atomic** - All or nothing migration application
- **Versioned** - Each migration tracked and ordered
- **Safe** - Only applies pending migrations

### Migration Status

**Check applied migrations:**
```bash
npx prisma migrate status
```

**Apply migrations manually:**
```bash
npx prisma migrate deploy
```

## Current Migrations

### 001_init_auth_tables

**Purpose:** Initialize Better Auth tables

**Tables Created:**
- `user` - User accounts with email verification
- `account` - OAuth provider accounts (Google, etc.)
- `session` - User sessions with tokens
- `verification` - Email verification tokens

**SQL Location:** `prisma/migrations/001_init_auth_tables/migration.sql`

**Schema Integration:**
```prisma
model User {
  id            String    @id
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                     String  @id
  userId                 String
  providerId             String
  accountId              String
  accessToken            String?
  refreshToken           String?
  idToken                String?
  accessTokenExpiresAt   DateTime?
  refreshTokenExpiresAt  DateTime?
  scope                  String?
  password               String?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Session {
  id        String   @id
  token     String   @unique
  userId    String
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## Best Practices

### Migration Naming

**Use descriptive names:**
```bash
✅ npx prisma migrate dev --name add_user_profile
✅ npx prisma migrate dev --name create_orders_table
❌ npx prisma migrate dev --name migration1
❌ npx prisma migrate dev --name stuff
```

### Schema Changes

**Additive changes:**
```prisma
// ✅ Safe - Add new optional field
model User {
  // ... existing fields
  bio String? // New optional field
}
```

**Breaking changes:**
```prisma
// ⚠️  Requires careful planning
model User {
  // ... existing fields
  email String @unique // Adding unique constraint
}
```

### Testing

**Always test locally:**
```bash
# 1. Reset database
npx prisma migrate reset

# 2. Apply all migrations
npx prisma migrate dev

# 3. Verify schema
npx prisma db pull

# 4. Test application
npm run dev
```

## Troubleshooting

### Common Issues

**Migration already applied:**
```bash
Error: Migration `001_init_auth_tables` has already been applied
```

**Solution:** Mark as applied
```bash
npx prisma migrate resolve --applied 001_init_auth_tables
```

**Table already exists:**
```bash
Error: relation "user" already exists
```

**Solution:** Reset and reapply
```bash
npx prisma migrate reset --force
npx prisma migrate dev
```

**Build failure:**
```bash
Error: Migration SQL syntax error
```

**Solution:** Review and fix migration SQL
```bash
# Edit migration file manually
vim prisma/migrations/001_init_auth_tables/migration.sql

# Test locally
npx prisma migrate deploy
```

### Production Issues

**Migration stuck:**
```bash
# Check migration status
npx prisma migrate status

# Apply manually if needed
npx prisma migrate deploy
```

**Schema drift:**
```bash
# Pull current schema
npx prisma db pull

# Compare with expected schema
npx prisma diff

# Create patch migration if needed
npx prisma migrate dev --name patch_schema
```

## Environment Variables

### Required for Migrations

```bash
# Database connection
DATABASE_URL="postgresql://user:password@host:port/database"

# Prisma configuration
PRISMA_GENERATE_DATAPROXY="true"
```

### Vercel Environment

**Production variables:** `vercel env ls`

**Local development:** `.env.local`
```bash
DATABASE_URL="postgresql://localhost:5432/rpm_dev"
```

## Advanced Topics

### Data Migrations

**For complex data transformations:**

1. **Create schema migration:**
```bash
npx prisma migrate dev --name add_new_field
```

2. **Create data migration script:**
```typescript
// scripts/migrate-user-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUserData() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Transform data
      }
    });
  }
}

migrateUserData();
```

3. **Run data migration:**
```bash
npx tsx scripts/migrate-user-data.ts
```

### Rollback Strategy

**Prisma doesn't support automatic rollbacks:**

1. **Create reverse migration:**
```bash
npx prisma migrate dev --name remove_products
```

2. **Manual rollback:**
```sql
-- In rollback migration
DROP TABLE IF EXISTS "Product";
```

3. **Apply rollback:**
```bash
npx prisma migrate deploy
```

## Monitoring

### Migration Performance

**Track migration time:**
```bash
# Add timing to build
time npx prisma migrate deploy
```

**Monitor database size:**
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Alerting

**Set up alerts for:**
- Migration failures
- Long-running migrations
- Schema drift detection

## Security Considerations

### Migration Security

**Database permissions:**
- Migrations need DDL rights
- Application uses limited permissions
- Separate migration user if possible

**Sensitive data:**
- Review migration SQL for sensitive data exposure
- Use environment variables for credentials
- Never commit database credentials

---

**Last Updated:** 2026-03-25  
**Next Review:** 2026-04-25
