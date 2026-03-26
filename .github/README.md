# 🚀 GitHub Actions Workflows - RPM Accesorios

## 📋 **ESTRATEGIA DE CI/CD ESENCIAL**

### **🏗️ WORKFLOWS MÍNIMOS Y ESENCIALES**

| Workflow | Trigger | Propósito | Duración |
|----------|---------|-----------|----------|
| **ci.yml** | Push/PR a main | Pipeline principal completo | ~3min |

## 🎯 **ESTRATEGIA POR ETAPA**

### **1. Pull Request (PR)**
```yaml
✅ Tests obligatorios (ci.yml):
- Unit tests (42 tests)
- Type check
- Build validation
- Lint
```

### **2. Merge to Main**
```yaml
✅ Tests completos (ci.yml):
- Unit tests + coverage
- E2E tests (25 tests)
- Security audit
- Build validation
- Deployment
```

### **3. Deployment**
```yaml
✅ Pre-deploy checks (ci.yml):
- Unit tests
- E2E tests
- Security scan
- Deploy to Vercel
```

## 🔧 **CONFIGURACIÓN CLAVE**

### **Variables de Entorno Requeridas**
```bash
# Repository Secrets
VERCEL_TOKEN=vercel-deploy-token
VERCEL_ORG_ID=vercel-org-id
VERCEL_PROJECT_ID=vercel-project-id
```

### **Branch Protection Rules**
```yaml
# Configurar en GitHub repository settings:
✅ Require status checks:
  - quick-check (unit + build)
  - e2e-test (solo main)
  - security

✅ Require PR review
✅ Require up-to-date branches
✅ Limit force pushes
```

## 📊 **MATRIZ DE CALIDAD**

| Tipo de Test | PR | Main | Deploy | Frecuencia |
|--------------|----|------|--------|-----------|
| **Unit Tests** | ✅ Obligatorio | ✅ Obligatorio | ✅ Obligatorio | Cada commit |
| **E2E Tests** | ❌ Omitido | ✅ Obligatorio | ✅ Obligatorio | Solo main |
| **Security** | ❌ Omitido | ✅ Obligatorio | ✅ Obligatorio | Cada push |

## 🚀 **OPTIMIZACIONES**

### **Caching Strategy**
```yaml
# pnpm cache optimizado
key: pnpm-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
restore-keys: pnpm-${{ runner.os }}-
```

### **Parallel Execution**
```yaml
# Jobs en paralelo
- quick-check (unit + build)
- e2e-test (solo main)
- security (todos)
```

### **Fail Fast Strategy**
```yaml
# Jobs con dependencias
needs: [quick-check] # E2E solo si unit tests pasan
needs: [quick-check, e2e-test, security] # Deploy solo si todo pasa
```

## 📈 **MÉTRICAS DE ÉXITO**

### **SLAs (Service Level Agreements)**
```yaml
✅ PR Feedback: < 2 minutos
✅ Main Pipeline: < 5 minutos
✅ Deploy Time: < 3 minutos
✅ Test Coverage: > 80%
✅ Security Score: 0 vulnerabilidades críticas
```

### **KPIs (Key Performance Indicators)**
```yaml
✅ Build Success Rate: > 95%
✅ Test Success Rate: > 98%
✅ Deploy Frequency: Diario
✅ Lead Time for Changes: < 1 hora
✅ Mean Time to Recovery: < 30 minutos
```

## 🚨 **TROUBLESHOOTING**

### **Common Issues**
```bash
# Cache problems
❌ Delete cache: GitHub Actions > Caches > Delete

# Timeouts
❌ Increase timeout: playwright.config.ts timeout: 120000

# Dependencies
❌ Clear pnpm cache: pnpm store prune

# Browser issues
❌ Reinstall Playwright: npx playwright install
```

### **Debug Commands**
```bash
# Local CI simulation
pnpm test:unit
pnpm test:e2e
pnpm build
pnpm build-storybook
```

---

**ESTRATEGIA MÍNIMA PERO COMPLETA - SOLO LO ESENCIAL** 🚀
