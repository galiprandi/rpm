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
    log: ['error'],
  });

// Enable singleton in all environments to prevent connection pool exhaustion in Vercel
globalForPrisma.prisma = prisma;
