import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'account', 'session', 'verification')
    `;

    const existingTables = (tables as any[]).map((t: any) => t.table_name);
    
    if (existingTables.length === 4) {
      return NextResponse.json({ 
        message: 'All tables already exist',
        tables: existingTables 
      });
    }

    // Create tables manually
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "user" (
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
      CREATE UNIQUE INDEX IF NOT EXISTS "user_email_idx" ON "user"(email);
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS account (
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
      CREATE INDEX IF NOT EXISTS "account_userId_idx" ON account("userId");
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS session (
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
      CREATE UNIQUE INDEX IF NOT EXISTS "session_token_idx" ON session(token);
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "session_userId_idx" ON session("userId");
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON verification(identifier);
    `;

    // Add foreign keys
    await prisma.$executeRaw`
      ALTER TABLE account ADD CONSTRAINT IF NOT EXISTS "account_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE;
    `;

    await prisma.$executeRaw`
      ALTER TABLE session ADD CONSTRAINT IF NOT EXISTS "session_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE;
    `;

    // Verify tables were created
    const newTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'account', 'session', 'verification')
    `;

    return NextResponse.json({ 
      message: 'Database setup completed successfully',
      tables: (newTables as any[]).map((t: any) => t.table_name)
    });

  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({ 
      error: 'Failed to setup database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
