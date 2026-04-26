/**
 * Query Analyzer Script
 * Scans the codebase to find database query patterns and optimization opportunities
 *
 * Usage: npx tsx scripts/analyze-queries.ts
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

interface QueryHotspot {
  file: string;
  line: number;
  type: 'N+1' | 'LOOP' | 'MULTI_QUERY' | 'INEFFICIENT';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  suggestion: string;
}

const hotspots: QueryHotspot[] = [];

function scanFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Pattern 1: N+1 - Query inside loop
  const loopQueryPattern = /(for|while)\s*\([^)]*\)\s*\{[\s\S]*?prisma\.\w+\.(find|create|update|delete)/;
  const loopMatch = content.match(loopQueryPattern);
  if (loopMatch && !filePath.includes('.test.')) {
    const lineNum = content.substring(0, loopMatch.index).split('\n').length;
    hotspots.push({
      file: filePath,
      line: lineNum,
      type: 'N+1',
      severity: 'HIGH',
      description: 'Database query inside loop (N+1 problem)',
      suggestion: 'Use updateMany or batch operations instead of individual queries in loops',
    });
  }

  // Pattern 2: Multiple sequential queries
  let queryCount = 0;
  let inAsyncFunction = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect async function start
    if (line.match(/async\s+function|=>\s*\{/)) {
      inAsyncFunction = true;
      queryCount = 0;
    }

    // Count queries
    if (line.match(/prisma\.\w+\.(find|create|update|delete|count|aggregate)/)) {
      queryCount++;

      // Flag if >3 queries in one function
      if (queryCount === 4) {
        hotspots.push({
          file: filePath,
          line: i + 1,
          type: 'MULTI_QUERY',
          severity: 'MEDIUM',
          description: `Function contains 4+ database queries`,
          suggestion: 'Consider using Promise.all() for parallel queries or consolidating queries',
        });
      }
    }

    // Pattern 3: Sequential findMany + loop
    if (line.match(/findMany\s*\(\s*\{[\s\S]*?\}\s*\)/)) {
      // Check next few lines for loop
      const nextLines = lines.slice(i + 1, i + 10).join('\n');
      if (nextLines.match(/\.(map|forEach|for|while)/)) {
        hotspots.push({
          file: filePath,
          line: i + 1,
          type: 'INEFFICIENT',
          severity: 'MEDIUM',
          description: 'findMany followed by loop - may indicate inefficient data processing',
          suggestion: 'Use Prisma include/select to fetch related data in single query',
        });
      }
    }
  }
}

function scanDirectory(dir: string): void {
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.next')) {
      scanDirectory(fullPath);
    } else if (stat.isFile() && item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      scanFile(fullPath);
    }
  }
}

// Main analysis
console.log('🔍 Analyzing database query patterns...\n');

scanDirectory('./app');
scanDirectory('./lib');

// Sort by severity
const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
hotspots.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

// Group by file
const byFile = new Map<string, QueryHotspot[]>();
for (const h of hotspots) {
  const list = byFile.get(h.file) || [];
  list.push(h);
  byFile.set(h.file, list);
}

// Output report
console.log(`Found ${hotspots.length} potential optimization opportunities\n`);

console.log('## 🔴 HIGH Priority (N+1 Queries)\n');
const n1Hotspots = hotspots.filter(h => h.severity === 'HIGH');
if (n1Hotspots.length === 0) {
  console.log('✅ No N+1 patterns detected\n');
} else {
  for (const h of n1Hotspots) {
    console.log(`⚠️  ${h.file}:${h.line}`);
    console.log(`   ${h.description}`);
    console.log(`   💡 ${h.suggestion}\n`);
  }
}

console.log('## 🟡 MEDIUM Priority (Multiple Queries)\n');
const mediumHotspots = hotspots.filter(h => h.severity === 'MEDIUM');
if (mediumHotspots.length === 0) {
  console.log('✅ No medium priority issues\n');
} else {
  // Show top 10
  for (const h of mediumHotspots.slice(0, 10)) {
    console.log(`⚠️  ${h.file}:${h.line}`);
    console.log(`   ${h.description}\n`);
  }
  if (mediumHotspots.length > 10) {
    console.log(`... and ${mediumHotspots.length - 10} more\n`);
  }
}

console.log('## 📁 Files with most queries\n');
const sortedFiles = Array.from(byFile.entries())
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 5);

for (const [file, issues] of sortedFiles) {
  console.log(`${file}: ${issues.length} potential issues`);
}

console.log('\n---');
console.log('Next steps:');
console.log('1. Set PRISMA_PERF_LOG=true in production to track real query counts');
console.log('2. Monitor /api/admin/query-stats for live metrics');
console.log('3. Focus on HIGH priority N+1 patterns first');
