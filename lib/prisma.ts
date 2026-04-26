import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enable query logging in development or when PRISMA_PERF_LOG is set
const enableQueryLog = process.env.NODE_ENV === 'development' ||
                       process.env.PRISMA_PERF_LOG === 'true';

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: enableQueryLog ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
