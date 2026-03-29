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

# Debug mode server
pnpm start:debug       # DEBUG_AUTH=true next start --port 3333
```

## Estrategia de Testing

### 1. Unit Tests (Vitest)
- **Servicios**: `/lib/services/*.test.ts`
  - ProductService: CRUD, búsqueda, filtros
  - CategoryService: CRUD básico
- **Mocks**: Prisma client con `vi.hoisted()`
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

## Debug Mode (QA Automation)

Para testing automatizado sin autenticación:

```bash
# Terminal 1: Iniciar servidor con debug
pnpm start:debug

# El servidor estará en http://localhost:3333
# Con DEBUG_AUTH=true, el proxy omite autenticación
```

⚠️ **Seguridad**: NUNCA usar en producción. Solo variable de entorno, nunca query params.

## Troubleshooting

### Error: EADDRINUSE
```bash
# Puerto 3000 ocupado
lsof -ti:3000 | xargs kill -9
# O usar otro puerto
pnpm start:debug  # Usa puerto 3333
```

### Puppeteer frame detached
- Reiniciar servidor MCP de Puppeteer
- O usar Playwright: `pnpm test:e2e`
