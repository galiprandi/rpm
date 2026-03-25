# Guía de Troubleshooting - RPM

## Overview

Guía completa para diagnóstico y resolución de problemas comunes en la aplicación RPM desplegada en Vercel.

## Issues Comunes

### Build Issues

#### Error: "Build failed"
**Síntomas:**
- Build falla en Vercel pero funciona localmente
- Error de dependencias o TypeScript

**Soluciones:**
```bash
# 1. Verificar build local
pnpm build

# 2. Limpiar caché
rm -rf .next node_modules
pnpm install

# 3. Verificar Node version
node --version  # Debe ser 24.x

# 4. Revisar package.json
cat package.json | grep "node"
```

**Verificación en Vercel:**
1. Panel → Deploy → Failed build → View Logs
2. Buscar errores específicos de dependencias
3. Verificar Node version en settings

#### Error: "Module not found"
**Síntomas:**
- Error de importación de módulos
- Dependencias faltantes

**Soluciones:**
```bash
# Verificar dependencias
pnpm ls

# Instalar dependencias faltantes
pnpm add missing-package

# Verificar importaciones
grep -r "import.*from" app/
```

### Deploy Issues

#### Error: "Deploy failed"
**Síntomas:**
- Push exitoso pero deploy falla
- Error de conexión GitHub-Vercel

**Soluciones:**
```bash
# 1. Verificar conexión
git remote -v

# 2. Verificar permisos GitHub
gh repo view galiprandi/rpm

# 3. Re-conectar Vercel
vercel link --confirm
```

#### Error: "Domain not configured"
**Síntomas:**
- URL no accesible
- Error 404 o DNS

**Soluciones:**
1. Panel Vercel → Settings → Domains
2. Verificar configuración DNS
3. Esperar propagación DNS (hasta 48h)

### Performance Issues

#### Error: "Slow loading"
**Síntomas:**
- LCP > 2.5s
- INP > 200ms

**Diagnóstico:**
```bash
# 1. Analizar bundle
npx @next/bundle-analyzer

# 2. Verificar imágenes
find public -name "*.jpg" -o -name "*.png"

# 3. Verificar Next.js Image usage
grep -r "next/image" app/
```

**Optimizaciones:**
```typescript
// Optimizar imágenes
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority={true} // Para imágenes above the fold
/>
```

#### Error: "Memory limit exceeded"
**Síntomas:**
- Error 502 o 503
- Logs de memoria en Vercel

**Soluciones:**
```typescript
// Optimizar uso de memoria
// Evitar variables globales grandes
// Implementar streaming para datos grandes
```

### Runtime Errors

#### Error: "500 Internal Server Error"
**Síntomas:**
- Error genérico del servidor
- Logs de error en Vercel

**Diagnóstico:**
```bash
# 1. Ver logs en tiempo real
vercel logs

# 2. Verificar health endpoint
curl https://rpm-wheat.vercel.app/api/health

# 3. Revisar código de API routes
find app/api -name "*.ts" -exec echo "=== {} ===" \; -exec cat {} \;
```

#### Error: "Environment variables missing"
**Síntomas:**
- Variables undefined
- Configuración faltante

**Soluciones:**
```bash
# 1. Verificar variables locales
cat .env.local

# 2. Verificar variables Vercel
vercel env ls

# 3. Agregar variables faltantes
vercel env add VARIABLE_NAME
```

## Herramientas de Diagnóstico

### Vercel CLI
```bash
# Ver status general
vercel ls

# Ver logs recientes
vercel logs --since=1h

# Verificar entorno
vercel env ls

# Deploy manual
vercel --prod
```

### Browser DevTools
```javascript
// Console debugging
fetch('/api/health')
  .then(res => res.json())
  .then(console.log);

// Network tab analysis
// Performance tab metrics
// Memory profiling
```

### External Tools
```bash
# PageSpeed Insights
curl "https://pagespeed.web.dev/report?url=https://rpm-wheat.vercel.app"

# WebPageTest
curl "https://webpagetest.org/?url=https://rpm-wheat.vercel.app"

# SSL Check
openssl s_client -connect rpm-wheat.vercel.app:443
```

## Procedimientos de Emergencia

### Downtime Total
**Acciones inmediatas:**
1. **Verificar status**: https://vercel.com/status
2. **Health check**: `curl -I https://rpm-wheat.vercel.app`
3. **Verificar último deploy**: Panel Vercel → Deployments
4. **Comunicar stakeholders**: Email inmediato

### Rollback Procedure
```bash
# 1. Identificar commit estable
git log --oneline -10

# 2. Revertir último commit
git revert HEAD

# 3. Forzar deploy
git push origin main

# 4. Verificar deploy
curl -I https://rpm-wheat.vercel.app
```

### Hotfix Procedure
```bash
# 1. Branch de hotfix
git checkout -b hotfix/critical-issue

# 2. Implementar fix
# Editar archivos necesarios

# 3. Test local
pnpm dev
# Verificar funcionalidad

# 4. Deploy hotfix
git add .
git commit -m "hotfix: critical issue fix"
git push origin hotfix/critical-issue

# 5. Merge a main
# Crear PR y merge
```

## Checklists de Troubleshooting

### Build Failure Checklist
- [ ] Node version correct (24.x)
- [ ] Dependencies actualizadas (`pnpm install`)
- [ ] Build exitoso localmente (`pnpm build`)
- [ ] Sin errores TypeScript
- [ ] Variables de entorno configuradas
- [ ] Espacio suficiente en build

### Deploy Failure Checklist
- [ ] GitHub conectado a Vercel
- [ ] Permisos de repositorio correctos
- [ ] Branch protection configurado
- [ ] Build exitoso antes de deploy
- [ ] Sin conflictos de merge

### Performance Issue Checklist
- [ ] Bundle size optimizado
- [ ] Imágenes optimizadas (next/image)
- [ ] Code splitting implementado
- [ ] Caching configurado
- [ ] CDN funcionando

### Runtime Error Checklist
- [ ] API routes funcionando
- [ ] Variables de entorno presentes
- [ ] Error handling implementado
- [ ] Logs configurados
- [ ] Health check respondiendo

## Contactos y Escalation

### Level 1 - Self Service
- **Resources**: Documentación y logs
- **Tools**: Vercel CLI, Browser DevTools
- **Time**: 0-30 minutos

### Level 2 - Team Support
- **Contact**: rpm.sysadim@gmail.com
- **Escalation**: Issues críticos o desconocidos
- **Time**: 30 minutos - 2 horas

### Level 3 - Emergency
- **Contact**: galiprandi (GitHub issues)
- **Escalation**: Downtime > 30 min
- **Time**: Inmediato

## Templates de Comunicación

### Internal Alert
```markdown
🚨 **RPM System Alert** 🚨

**Issue**: [Descripción del problema]
**Impact**: [Usuarios afectados, funcionalidad impactada]
**Status**: [Investigando / Resolviendo / Resuelto]
**ETA**: [Tiempo estimado de resolución]
**Next Update**: [Próxima actualización]

**Actions**: [Acciones en progreso]
**Contact**: rpm.sysadim@gmail.com
```

### Stakeholder Communication
```markdown
**RPM Service Status Update**

Dear Stakeholders,

We are currently experiencing [issue type] affecting the RPM application.

**Current Status**: [Brief status]
**Impact**: [User impact description]
**Timeline**: [Resolution timeline]
**Next Steps**: [Action items]

We will provide updates every [frequency] until resolved.

Best regards,
RPM Team
```

## Documentación Relacionada

- [Deployment Guide](deployment.md)
- [Monitoring Guide](monitoring.md)
- [System Specifications](../specs/vercel-deployment.md)
- [Vercel Documentation](https://vercel.com/docs)

## Actualización de esta Guía

- **Last Updated**: 2025-03-25
- **Next Review**: 2025-04-25
- **Version**: 1.0.0
- **Maintainer**: rpm.sysadim@gmail.com
