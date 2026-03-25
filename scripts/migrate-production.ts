#!/usr/bin/env node

/**
 * Production Database Migration Script
 * 
 * This script runs database migrations during the build process
 * to ensure the database schema is always up to date.
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

async function runMigrations() {
  console.log('🔄 Running production database migrations...');
  
  try {
    // Check if we're in production
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL not found, skipping migrations');
      process.exit(0);
    }

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'account', 'session', 'verification')
    `;

    const existingTables = (tables as any[]).map((t: any) => t.table_name);
    console.log(`📋 Existing tables: ${existingTables.join(', ')}`);

    if (existingTables.length === 4) {
      console.log('✅ All tables already exist, skipping migrations');
      await prisma.$disconnect();
      return;
    }

    // Create tables manually (since Better Auth doesn't use Prisma migrations)
    console.log('🔨 Creating Better Auth tables...');

    await prisma.$executeRaw`
      DROP TABLE IF EXISTS verification CASCADE;
      DROP TABLE IF EXISTS session CASCADE;
      DROP TABLE IF EXISTS account CASCADE;
      DROP TABLE IF EXISTS "user" CASCADE;
    `;

    await prisma.$executeRaw`
      CREATE TABLE "user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        "emailVerified" BOOLEAN DEFAULT false,
        image TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await prisma.$executeRaw`
      CREATE UNIQUE INDEX "user_email_idx" ON "user"(email);
    `;

    await prisma.$executeRaw`
      CREATE TABLE account (
        id TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        scope TEXT,
        password TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await prisma.$executeRaw`
      CREATE INDEX "account_userId_idx" ON account("userId");
    `;

    await prisma.$executeRaw`
      CREATE TABLE session (
        id TEXT PRIMARY KEY,
        "expiresAt" TIMESTAMP NOT NULL,
        token TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL
      );
    `;

    await prisma.$executeRaw`
      CREATE UNIQUE INDEX "session_token_idx" ON session(token);
    `;

    await prisma.$executeRaw`
      CREATE INDEX "session_userId_idx" ON session("userId");
    `;

    await prisma.$executeRaw`
      CREATE TABLE verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await prisma.$executeRaw`
      CREATE INDEX "verification_identifier_idx" ON verification(identifier);
    `;

    // Add foreign keys
    await prisma.$executeRaw`
      ALTER TABLE account ADD CONSTRAINT "account_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE;
    `;

    await prisma.$executeRaw`
      ALTER TABLE session ADD CONSTRAINT "session_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE;
    `;

    console.log('✅ Better Auth tables created successfully');
    
    // Verify tables were created
    const newTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'account', 'session', 'verification')
    `;

    const createdTables = (newTables as any[]).map((t: any) => t.table_name);
    console.log(`📊 Created tables: ${createdTables.join(', ')}`);

    await prisma.$disconnect();
    console.log('🎉 Production migrations completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
