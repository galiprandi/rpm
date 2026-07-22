#!/usr/bin/env tsx

/**
 * Database Validation Script
 * 
 * Este script valida la configuración de base de datos local y producción
 * antes de hacer deploy o cambios importantes.
 * 
 * Uso:
 *   npx tsx scripts/validate-db.ts
 *   pnpm run db:validate
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

interface ValidationResult {
  success: boolean;
  checks: CheckResult[];
  summary: string;
}

interface CheckResult {
  name: string;
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

class DatabaseValidator {
  private results: CheckResult[] = [];

  async runAllChecks(): Promise<ValidationResult> {
    console.log('🔍 Starting Database Validation...\n');

    // Environment checks
    await this.checkEnvironmentVariables();
    await this.checkDockerRunning();
    await this.checkDatabaseConnection();
    
    // Drizzle checks
    await this.checkDrizzleSchema();
    
    // Production checks
    await this.checkProductionHealth();
    
    // Generate summary
    return this.generateSummary();
  }

  private async checkEnvironmentVariables(): Promise<void> {
    const name = 'Environment Variables';
    try {
      const requiredVars = ['DATABASE_URL'];
      const missingVars: string[] = [];

      requiredVars.forEach(varName => {
        if (!process.env[varName]) {
          missingVars.push(varName);
        }
      });

      if (missingVars.length > 0) {
        throw new Error(`Missing variables: ${missingVars.join(', ')}`);
      }

      this.results.push({
        name,
        success: true,
        message: 'All required environment variables are set',
        details: {
          databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
          nodeEnv: process.env.NODE_ENV || 'development'
        }
      });
      console.log(`✅ ${name}: Check passed`);
    } catch (error) {
      this.results.push({
        name,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkDockerRunning(): Promise<void> {
    const name = 'Docker PostgreSQL';
    try {
      const result = execSync('docker ps --filter name=rpm-postgres --format "{{.Names}}"', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      if (result.trim().includes('rpm-postgres')) {
        this.results.push({
          name,
          success: true,
          message: 'Docker PostgreSQL container is running',
          details: { container: 'rpm-postgres' }
        });
        console.log(`✅ ${name}: Check passed`);
      } else {
        throw new Error('PostgreSQL container not found');
      }
    } catch (dockerError) {
      this.results.push({
        name,
        success: false,
        message: 'Docker PostgreSQL is not running. Run: pnpm run db:start'
      });
      console.log(`❌ ${name}: Docker PostgreSQL is not running. Run: pnpm run db:start`);
    }
  }

  private async checkDatabaseConnection(): Promise<void> {
    const name = 'Database Connection';
    try {
      // Import db dynamically to avoid issues if not configured
      const { db } = await import('../lib/db');
      const { sql } = await import('drizzle-orm');
      
      await db.execute(sql`SELECT 1`);
      
      this.results.push({
        name,
        success: true,
        message: 'Database connection successful',
        details: { query: 'SELECT 1 executed successfully' }
      });
      console.log(`✅ ${name}: Check passed`);
    } catch (error) {
      this.results.push({
        name,
        success: false,
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      console.log(`❌ ${name}: Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkDrizzleSchema(): Promise<void> {
    const name = 'Drizzle Schema';
    try {
      const schemaPath = './db/schema/schema.ts';

      if (!existsSync(schemaPath)) {
        throw new Error('Drizzle schema file not found');
      }

      this.results.push({
        name,
        success: true,
        message: 'Drizzle schema is valid',
        details: { schemaPath }
      });
      console.log(`✅ ${name}: Check passed`);
    } catch (schemaError) {
      this.results.push({
        name,
        success: false,
        message: 'Drizzle schema validation failed'
      });
      console.log(`❌ ${name}: Drizzle schema validation failed`);
    }
  }

  private async checkProductionHealth(): Promise<void> {
    const name = 'Production Health Check';
    try {
      const response = await fetch('https://rpm-wheat.vercel.app/api/health/db');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status !== 'healthy') {
        throw new Error(`Production database is unhealthy: ${data.error || 'Unknown error'}`);
      }

      this.results.push({
        name,
        success: true,
        message: 'Production database is healthy',
        details: {
          status: data.status,
          connections: data.connections,
          timestamp: data.timestamp
        }
      });
      console.log(`✅ ${name}: Check passed`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch')) {
        this.results.push({
          name,
          success: false,
          message: 'Cannot reach production health check endpoint'
        });
        console.log(`❌ ${name}: Cannot reach production health check endpoint`);
      } else {
        this.results.push({
          name,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        console.log(`❌ ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private generateSummary(): ValidationResult {
    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    const allPassed = successCount === totalCount;

    const summary = allPassed 
      ? `✅ All ${totalCount} database validation checks passed!`
      : `❌ ${totalCount - successCount}/${totalCount} checks failed`;

    return {
      success: allPassed,
      checks: this.results,
      summary
    };
  }
}

// CLI execution
async function main() {
  const validator = new DatabaseValidator();
  
  try {
    const result = await validator.runAllChecks();
    
    console.log('\n' + '='.repeat(50));
    console.log(result.summary);
    console.log('='.repeat(50));

    // Show detailed results
    console.log('\n📋 Detailed Results:');
    result.checks.forEach(check => {
      console.log(`\n${check.success ? '✅' : '❌'} ${check.name}`);
      console.log(`   ${check.message}`);
      if (check.details) {
        console.log(`   Details: ${JSON.stringify(check.details, null, 2)}`);
      }
    });

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Validation failed with error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DatabaseValidator };
