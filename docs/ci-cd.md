# CI/CD Pipeline - RPM Accesorios

## Overview

Pipeline de integración continua y despliegue automatizado configurado con GitHub Actions y Vercel.

## Arquitectura del Pipeline

### Flujo Principal
```
Development → PR → Main Branch → CI/CD → Vercel Production
```

### Workflows Configurados

#### 1. PR Check (`.github/workflows/pr-check.yml`)
**Trigger**: Pull Request a `main`

**Jobs**:
- **Lint**: ESLint validation
- **Type Check**: TypeScript compilation
- **Unit Tests**: Vitest execution
- **Build**: Next.js production build

**Características**:
- ⚡ **Rápido**: < 2 minutos
- 🚫 **Sin E2E**: Tests pesados separados
- 📦 **Build validation**: Asegura compilación exitosa

#### 2. CI/CD Pipeline (`.github/workflows/ci.yml`)
**Trigger**: Push a `main`

**Jobs**:
- **Quick Check**: Lint + Type + Unit + Build
- **E2E Tests**: Playwright testing completo
- **Security**: Audit de dependencias + secret scanning
- **Deploy**: Despliegue automático a Vercel

**Características**:
- 🔒 **Protección**: Tests completos antes de producción
- 🐛 **Debug**: Screenshots/videos en fallos
- 🔐 **Seguridad**: Validación de vulnerabilidades

## Testing Strategy

### Separación de Tests

#### PR Checks (Rápido)
```yaml
# Solo tests rápidos
- pnpm lint
- pnpm run type-check  
- pnpm run test:run
- pnpm run build
```

#### Main Pipeline (Completo)
```yaml
# Todo el suite de tests
- pnpm lint
- pnpm run type-check
- pnpm run test:run
- pnpm run build
- pnpm run test:e2e:ci
- Security audit
- Deploy to Vercel
```

### Configuración de Tests

#### Unit Tests (Vitest)
- **Framework**: Vitest
- **Environment**: jsdom
- **Coverage**: v8 provider
- **Thresholds**: 90% global

#### E2E Tests (Playwright)
- **Browsers**: Chromium (solo Chrome)
- **Reporter**: `line` (CI), `html` (dev)
- **Timeout**: 120s
- **Retries**: 2 en CI, 0 en local

### Scripts de Testing

```bash
# Unitarios
pnpm run test:run        # CI mode
pnpm run test:ui         # Development mode
pnpm run test:coverage   # Con coverage

# E2E
pnpm run test:e2e        # CI mode (termina solo)
pnpm run test:e2e:ci     # CI explícito
pnpm run test:e2e:dev    # Development con UI
pnpm run test:e2e:debug  # Debug paso a paso
```

## Deployment Configuration

### Vercel Integration

#### Automatic Deploy
- **Trigger**: Merge a `main`
- **Build Command**: `pnpm run build`
- **Output Directory**: `.next`
- **Node Version**: 24.x

#### Environment Variables
```bash
# Production (Vercel)
NEXTAUTH_URL=https://rpm-wheat.vercel.app
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
DATABASE_URL=${DATABASE_URL}
```

### Build Process

#### Dependencies
```bash
pnpm install --frozen-lockfile
```

#### Build Steps
```bash
# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Unit tests
pnpm run test:run

# Build
pnpm run build
```

#### Output Validation
- ✅ Build exit code: 0
- ✅ No TypeScript errors
- ✅ No ESLint warnings
- ✅ All tests passing

## Security Pipeline

### Dependency Audit
```bash
# Security audit
npx audit-ci --moderate
```

### Secret Scanning
```bash
# TruffleHog
trufflehog --regex --entropy=False ./
```

### Validaciones
- 🔍 **Vulnerabilities**: Moderate y superior
- 🔑 **Secrets**: API keys, tokens, passwords
- 📦 **Dependencies**: Versiones seguras

## Monitoring y Alerting

### Vercel Analytics
- **Build Status**: Dashboard en tiempo real
- **Performance**: Core Web Vitals
- **Errors**: Logs automáticos

### GitHub Actions
- **Workflow Status**: Badges en README
- **Build Time**: Métricas de duración
- **Failure Rate**: Estadísticas de fallos

### Alerting (Futuro)
- 📧 **Email notifications**: Build failures
- 📱 **Slack integration**: Status updates
- 📊 **Dashboard**: Métricas en tiempo real

## Performance Metrics

### Build Times
- **PR Check**: < 2 minutos
- **CI Pipeline**: 5-7 minutos
- **Deploy**: < 1 minuto

### Test Execution
- **Unit Tests**: < 30 segundos
- **E2E Tests**: 3-4 minutos
- **Total Tests**: < 5 minutos

### Optimization Strategies
- **Caching**: Dependencies cache
- **Parallel**: Multiple jobs simultáneos
- **Conditional**: E2E solo en main

## Troubleshooting

### Build Failures

#### TypeScript Errors
```bash
# Verificar tipos
pnpm run type-check

# Errores comunes
- Missing imports
- Type mismatches
- Configuration errors
```

#### Test Failures
```bash
# Unit tests
pnpm run test:ui  # Debug interactivo

# E2E tests
pnpm run test:e2e:debug  # Paso a paso
```

#### Dependency Issues
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Audit fix
pnpm audit --fix
```

### Deployment Issues

#### Vercel Build Failures
1. **Check logs**: Build logs en Vercel
2. **Local build**: `pnpm run build`
3. **Environment**: Variables correctas

#### Runtime Errors
1. **Vercel logs**: Function logs
2. **Local testing**: `pnpm run start`
3. **Environment**: `.env.local` vs production

## Best Practices

### Commits
- **Conventional commits**: `feat:`, `fix:`, `docs:`
- **Branch naming**: `feat/feature-name`
- **PR descriptions**: Detalles de cambios

### Testing
- **TDD**: Tests antes de código
- **Coverage**: Mantener >90%
- **Regression**: Tests para bugs conocidos

### Security
- **Secrets**: Nunca commitear
- **Dependencies**: Actualizaciones regulares
- **Audit**: Scanning periódico

## Vinculación

- **Config**: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
- **PR Config**: [`.github/workflows/pr-check.yml`](../.github/workflows/pr-check.yml)
- **Tests**: [`/tests/playwright/core-routes.spec.ts`](../tests/playwright/core-routes.spec.ts)
- **Spec**: [`/specs/core.md`](../specs/core.md)
