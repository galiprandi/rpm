# Testing Guide - RPM

## Scripts Disponibles

```bash
# Unit tests
pnpm test              # Ejecuta vitest
pnpm test:coverage     # Con cobertura

# E2E tests
pnpm test:e2e          # Playwright tests

# Type checking
pnpm type-check        # npx tsc --noEmit

# Dev bypass auth (solo desarrollo local)
RPM_DEV_BYPASS_AUTH=true pnpm dev
```

## Estrategia de Testing

### 1. Unit Tests (Vitest)
- **Servicios**: `/lib/services/*.test.ts`
  - ProductService: CRUD, búsqueda, filtros
  - CategoryService: CRUD básico
- **Mocks**: Drizzle client con `vi.hoisted()`
- **Cobertura esperada**: ≥80%

### 2. E2E Tests (Puppeteer MCP)
- **Flujos críticos**:
  - Login/debug bypass
  - CRUD de productos
  - CRUD de categorías
  - Validación de UI

### 3. QA Checklist
- [ ] Tests unitarios pasan
- [ ] Type check sin errores
- [ ] E2E screenshots validados
- [ ] Consola sin errores

## Development Auth Bypass (QA Automation)

Para testing automatizado sin autenticación OAuth:

```bash
# Terminal 1: Iniciar servidor con bypass
RPM_DEV_BYPASS_AUTH=true pnpm dev

# El servidor estará en http://localhost:3000
# Con RPM_DEV_BYPASS_AUTH=true, el sistema genera sesión mock en desarrollo
```

⚠️ **Seguridad**: Solo funciona en `NODE_ENV=development`. En producción no existe.

## Troubleshooting

### Error: EADDRINUSE
```bash
# Puerto 3000 ocupado
lsof -ti:3000 | xargs kill -9
# O usar otro puerto
RPM_DEV_BYPASS_AUTH=true pnpm dev -- -p 3333
```

### Puppeteer frame detached
- Reiniciar servidor MCP de Puppeteer
- O usar Playwright: `pnpm test:e2e`
