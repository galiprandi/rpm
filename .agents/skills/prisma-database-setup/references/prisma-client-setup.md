# Prisma Client Setup

Generate and instantiate Prisma Client for any database provider.

## 1. Install dependencies

```bash
npm install prisma --save-dev
npm install @prisma/client
```

## 2. Add generator block

In `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated"
}
```

Prisma v7 requires an explicit `output` path and will not generate into `node_modules` by default.

## 3. Generate Prisma Client

```bash
npx prisma generate
```

Re-run `prisma generate` after every schema change to keep the client in sync.

## 4. Instantiate Prisma Client

```typescript
import { PrismaClient } from '../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
```

If you change the generator `output`, update the import path to match. In Prisma ORM 7, a **driver adapter is required** — replace `PrismaPg` with the adapter for your database.

## 5. Decimal Field Handling (Prisma 7 with Driver Adapter)

When using Prisma ORM 7 with driver adapters (e.g., `@prisma/adapter-pg`), Decimal fields require special handling:

### The Problem
Using `new Prisma.Decimal()` from the generated client causes `NullConstraintViolation` errors:

```typescript
// ❌ DON'T DO THIS - Causes errors with driver adapters
import { Prisma } from '@/generated/client'
await prisma.product.create({
  data: {
    costPrice: new Prisma.Decimal(12.50), // Error!
  }
})
```

### The Solution
Pass Decimal values as **numbers directly** - Prisma 7 with driver adapter handles conversion automatically:

```typescript
// ✅ CORRECT - Pass numbers directly
await prisma.product.create({
  data: {
    costPrice: 12.50,        // Number works fine
    replacementCost: 15.00,  // Number works fine
  }
})
```

Or for dynamic values from API requests:
```typescript
// ✅ CORRECT - Pass values directly
await prisma.product.create({
  data: {
    costPrice: body.costPrice,        // number from request
    replacementCost: body.replacementCost,
  }
})
```

### Important Notes
- **Don't use** `new Prisma.Decimal()` with driver adapters
- **Don't convert** to strings (`.toString()`)
- **Do** pass JavaScript numbers directly
- The driver adapter handles the Decimal conversion internally

## 6. Use a single instance

Each `PrismaClient` instance creates a connection pool. Reuse a single instance per app process to avoid exhausting database connections.
