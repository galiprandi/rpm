#!/usr/bin/env node
/**
 * Database Reset Script - Production
 * 
 * ⚠️ WARNING: This will DELETE ALL DATA in the database
 * Only use when confirmed safe to do so
 */

import { execSync } from 'child_process';

console.log('🗑️  Resetting database...');

try {
  // Step 1: Reset database (drop all tables)
  console.log('Step 1: Dropping all tables...');
  execSync('pnpm prisma migrate reset --force --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  // Step 2: Apply all migrations fresh
  console.log('Step 2: Applying migrations...');
  execSync('pnpm prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  // Step 3: Run seed
  console.log('Step 3: Seeding database...');
  execSync('pnpm prisma db seed', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  console.log('✅ Database reset complete!');
} catch (error) {
  console.error('❌ Reset failed:', error);
  process.exit(1);
}
