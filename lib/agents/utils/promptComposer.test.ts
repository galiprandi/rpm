import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { composeSystemPrompt } from './promptComposer';
import { UserRole } from '@/lib/auth/roles';

/**
 * Validates that routeContexts in promptComposer.ts covers every route
 * under app/adm/. Prevents silent degradation when new admin pages are added.
 */

function getAdmRoutes(dir: string, base = '/adm'): string[] {
  const routes: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip Next.js special dirs
      if (entry.startsWith('_') || entry.startsWith('.')) continue;

      const route = entry.startsWith('[') ? base : `${base}/${entry}`;
      routes.push(route);
      routes.push(...getAdmRoutes(fullPath, route));
    }
  }

  return routes;
}

describe('routeContexts coverage', () => {
  it('every /adm/* directory has a routeContext entry', () => {
    const admDir = join(process.cwd(), 'app/adm');
    const routes = getAdmRoutes(admDir);

    // Get unique top-level route segments (e.g. /adm/products, not /adm/products/[id])
    const topLevelRoutes = new Set(
      routes.map((r) => {
        const parts = r.split('/');
        return parts.length >= 3 ? `/${parts.slice(1, 3).join('/')}` : r;
      }),
    );

    // Read promptComposer.ts to extract routeContext keys
    const source = readFileSync(
      join(process.cwd(), 'lib/agents/utils/promptComposer.ts'),
      'utf-8',
    );
    const routeKeyMatches = source.matchAll(/"\/adm\/[^"]+"/g);
    const definedRoutes = new Set(
      [...routeKeyMatches].map((m) => m[0].replace(/"/g, '')),
    );

    const missing = [...topLevelRoutes].filter((r) => !definedRoutes.has(r));
    expect(missing, `Missing routeContexts for: ${missing.join(', ')}`).toEqual([]);
  });

  it('composeSystemPrompt includes route context for known routes', () => {
    const prompt = composeSystemPrompt({
      role: UserRole.STAFF,
      chatId: 'test',
      pathname: '/adm/products',
    });
    expect(prompt).toContain('Contexto de Ruta');
    expect(prompt).toContain('Productos');
  });

  it('composeSystemPrompt falls back gracefully for unknown routes', () => {
    const prompt = composeSystemPrompt({
      role: UserRole.STAFF,
      chatId: 'test',
      pathname: '/nonexistent-page',
    });
    // Should not include "Contexto de Ruta" for routes outside /adm
    expect(prompt).not.toContain('Contexto de Ruta');
  });

  it('composeSystemPrompt includes role prompt', () => {
    const prompt = composeSystemPrompt({
      role: UserRole.ADMIN,
      chatId: 'test',
    });
    expect(prompt).toContain('ADMINISTRADOR');
  });

  it('composeSystemPrompt includes runtime context', () => {
    const prompt = composeSystemPrompt({
      role: UserRole.STAFF,
      chatId: 'chat-123',
      userName: 'Jorge',
      pathname: '/adm/cash',
    });
    expect(prompt).toContain('CHAT_ID: chat-123');
    expect(prompt).toContain('USER_NAME: Jorge');
    expect(prompt).toContain('CURRENT_PAGE: /adm/cash');
  });
});
