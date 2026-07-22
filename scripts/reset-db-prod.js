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
  // Step 1: Drop all tables and reapply schema
  console.log('Step 1: Push schema (drop + recreate)...');
  execSync('pnpm drizzle-kit push --force', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  // Step 2: Run seed
  console.log('Step 2: Seeding database...');
  execSync('pnpm db:seed', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  console.log('✅ Database reset complete!');
} catch (error) {
  console.error('❌ Reset failed:', error);
  process.exit(1);
}
