# Database Migrations Guide

## Overview

This guide covers database migrations for RPM Accesorios using Drizzle Kit. Migrations are automatically applied during deployment to ensure the database schema is always up to date.

## Migration Strategy

### Automatic Deploy Migrations

**Build Process:**
```json
{
  "scripts": {
    "build": "pnpm db:migrate && next build"
  }
}
```

**Deployment Flow:**
1. **Code pushed** → Vercel triggers build
2. **Drizzle migrate** → Applies pending migrations
3. **Next build** → Builds application
4. **Deploy** → Application deployed with updated schema

### Migration Files

**Location:** `db/migrations/`

**Structure:**
```
db/migrations/
├── 001_init_auth_tables/
│   └── migration.sql
├── 002_add_products/
│   └── migration.sql
└── ...
```

## Development Workflow

### Creating New Migrations

**1. Modify Schema:**
```typescript
// db/schema/schema.ts
export const product = pgTable('product', {
  id: text('id').primaryKey().$defaultFn(() => cuid()),
  name: text('name').notNull(),
  price: decimal('price', { precision: 65, scale: 30 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});
```

**2. Generate Migration:**
```bash
pnpm db:generate && pnpm db:migrate
```

**3. Review Generated SQL:**
```sql
-- db/migrations/002_add_products/migration.sql
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);
```

**4. Test Locally:**
```bash
pnpm db:generate && pnpm db:migrate
npm run dev
```

**5. Commit and Deploy:**
```bash
git add db/migrations/002_add_products/
git commit -m "feat: add products table"
git push origin main
```

## Production Deployment

### Automatic Application

Migrations are automatically applied during the Vercel build process:

```bash
# Vercel build command
pnpm db:migrate && next build
```

**Benefits:**
- **Zero downtime** - Migrations run before deployment
- **Atomic** - All or nothing migration application
- **Versioned** - Each migration tracked and ordered
- **Safe** - Only applies pending migrations

### Migration Status

**Check applied migrations:**
```bash
pnpm db:migrate
```

**Apply migrations manually:**
```bash
pnpm db:migrate
```

## Current Migrations

### 001_init_auth_tables

**Purpose:** Initialize Better Auth tables

**Tables Created:**
- `user` - User accounts with email verification
- `account` - OAuth provider accounts (Google, etc.)
- `session` - User sessions with tokens
- `verification` - Email verification tokens

**SQL Location:** `db/migrations/001_init_auth_tables/migration.sql`

**Schema Integration:**
```typescript
// db/schema/schema.ts
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  providerId: text('provider_id').notNull(),
  accountId: text('account_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { mode: 'string' }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { mode: 'string' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  userId: text('user_id').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});
```

## Best Practices

### Migration Naming

**Use descriptive names:**
```bash
✅ pnpm db:generate && pnpm db:migrate  # add_user_profile
✅ pnpm db:generate && pnpm db:migrate  # create_orders_table
❌ pnpm db:generate && pnpm db:migrate  # migration1
❌ pnpm db:generate && pnpm db:migrate  # stuff
```

### Schema Changes

**Additive changes:**
```typescript
// db/schema/schema.ts
// ✅ Safe - Add new optional field
export const user = pgTable('user', {
  // ... existing columns
  bio: text('bio'), // New optional field
});
```

**Breaking changes:**
```typescript
// db/schema/schema.ts
// ⚠️  Requires careful planning
export const user = pgTable('user', {
  // ... existing columns
  email: text('email').notNull().unique(), // Adding unique constraint
});
```

### Testing

**Always test locally:**
```bash
# 1. Apply all migrations
pnpm db:generate && pnpm db:migrate

# 2. Verify schema
pnpm db:push

# 3. Test application
npm run dev
```

## Troubleshooting

### Common Issues

**Migration already applied:**
```bash
Error: Migration `001_init_auth_tables` has already been applied
```

**Solution:** Drizzle tracks applied migrations in the `__drizzle_migrations` table. Remove the offending entry if needed, or re-run `pnpm db:migrate`.

**Table already exists:**
```bash
Error: relation "user" already exists
```

**Solution:** Review migration state and reapply
```bash
# Review pending migrations
pnpm db:migrate
```

**Build failure:**
```bash
Error: Migration SQL syntax error
```

**Solution:** Review and fix migration SQL
```bash
# Edit migration file manually
vim db/migrations/001_init_auth_tables/migration.sql

# Test locally
pnpm db:migrate
```

### Production Issues

**Migration stuck:**
```bash
# Check migration status
pnpm db:migrate

# Apply manually if needed
pnpm db:migrate
```

**Schema drift:**
```bash
# Push current schema directly
pnpm db:push

# Create patch migration if needed
pnpm db:generate && pnpm db:migrate
```

## Environment Variables

### Required for Migrations

```bash
# Database connection
DATABASE_URL="postgresql://user:password@host:port/database"
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
pnpm db:generate && pnpm db:migrate
```

2. **Create data migration script:**
```typescript
// scripts/migrate-user-data.ts
import { db } from '../lib/db';
import { user } from '../db/schema/schema';

async function migrateUserData() {
  const users = await db.select().from(user);

  for (const u of users) {
    await db.update(user).set({
      // Transform data
    }).where(eq(user.id, u.id));
  }
}

migrateUserData();
```

3. **Run data migration:**
```bash
npx tsx scripts/migrate-user-data.ts
```

### Rollback Strategy

**Drizzle doesn't support automatic rollbacks:**

1. **Create reverse migration:**
```bash
pnpm db:generate && pnpm db:migrate
```

2. **Manual rollback:**
```sql
-- In rollback migration
DROP TABLE IF EXISTS "product";
```

3. **Apply rollback:**
```bash
pnpm db:migrate
```

## Monitoring

### Migration Performance

**Track migration time:**
```bash
# Add timing to build
time pnpm db:migrate
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
