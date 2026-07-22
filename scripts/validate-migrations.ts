#!/usr/bin/env node
/**
 * Validates that Drizzle migration SQL files use idempotent DDL.
 *
 * Rules:
 * - In CI (--ci): Only validates migrations that were ADDED or MODIFIED in this PR/push.
 * - Locally (no flags): Validates ALL migrations (useful for one-time cleanup).
 *
 * Run manually: npx tsx scripts/validate-migrations.ts
 * Run in CI:     npx tsx scripts/validate-migrations.ts --ci
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations');

// DDL operations that must use IF EXISTS / IF NOT EXISTS
const DESTRUCTIVE_PATTERNS = [
  { regex: /\bDROP\s+INDEX\s+(?!IF\s+EXISTS)/i, fix: 'DROP INDEX IF EXISTS' },
  { regex: /\bALTER\s+TABLE\s+\S+\s+DROP\s+COLUMN\s+(?!IF\s+EXISTS)/i, fix: 'ALTER TABLE ... DROP COLUMN IF EXISTS' },
  { regex: /\bALTER\s+TABLE\s+\S+\s+DROP\s+CONSTRAINT\s+(?!IF\s+EXISTS)/i, fix: 'ALTER TABLE ... DROP CONSTRAINT IF EXISTS' },
  { regex: /\bDROP\s+TABLE\s+(?!IF\s+EXISTS)/i, fix: 'DROP TABLE IF EXISTS' },
  { regex: /\bCREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)/i, fix: 'CREATE TABLE IF NOT EXISTS' },
  { regex: /\bALTER\s+TABLE\s+\S+\s+ADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS)/i, fix: 'ALTER TABLE ... ADD COLUMN IF NOT EXISTS' },
];

interface Violation {
  file: string;
  line: number;
  text: string;
  fix: string;
}

function findViolations(sqlContent: string, fileName: string): Violation[] {
  const violations: Violation[] = [];
  const lines = sqlContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of DESTRUCTIVE_PATTERNS) {
      if (pattern.regex.test(line)) {
        violations.push({
          file: fileName,
          line: i + 1,
          text: line.trim(),
          fix: pattern.fix,
        });
      }
    }
  }

  return violations;
}

function getChangedMigrations(): string[] {
  try {
    // Get changed files in db/migrations/ since origin/main
    const output = execSync(
      'git diff --name-only --diff-filter=ACMRT origin/main HEAD -- db/migrations/',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    return output
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.endsWith('.sql'))
      .map(f => path.basename(f));
  } catch {
    return [];
  }
}

function getAllMigrations(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(name => name.endsWith('.sql'))
    .map(name => path.basename(name));
}

function main() {
  const isCI = process.argv.includes('--ci');

  // In CI: only validate changed migrations. Locally: validate all.
  const migrationsToCheck = isCI ? getChangedMigrations() : getAllMigrations();

  if (isCI && migrationsToCheck.length === 0) {
    console.log('✅ No new migrations to validate.');
    process.exit(0);
  }

  const allViolations: Violation[] = [];

  for (const migrationName of migrationsToCheck) {
    const sqlPath = path.join(MIGRATIONS_DIR, migrationName);
    if (!fs.existsSync(sqlPath)) continue;

    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    const violations = findViolations(sqlContent, migrationName);
    allViolations.push(...violations);
  }

  if (allViolations.length === 0) {
    console.log('✅ All migrations are idempotent. No issues found.');
    process.exit(0);
  }

  console.error(`❌ Found ${allViolations.length} non-idempotent operation(s) in migrations:\n`);
  for (const v of allViolations) {
    console.error(`  📁 ${v.file}:${v.line}`);
    console.error(`     ${v.text}`);
    console.error(`     💡 Fix: Use "${v.fix}" instead\n`);
  }

  if (isCI) {
    console.error('\n🚫 Migration validation failed. Fix the issues above before merging.');
  } else {
    console.error('\n🚫 Please fix the issues above before committing.');
  }

  process.exit(1);
}

main();
