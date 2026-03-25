# Guía de Monitorización - RPM

## Overview

Monitorización integral de la aplicación RPM desplegada en Vercel, incluyendo métricas de rendimiento, disponibilidad y salud del sistema.

## Métricas Clave

### Performance Metrics

#### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s objetivo
- **INP (Interaction to Next Paint)**: < 200ms objetivo  
- **CLS (Cumulative Layout Shift)**: < 0.1 objetivo

#### Application Metrics
- **Response Time**: < 200ms promedio
- **Uptime**: 99.9% objetivo
- **Error Rate**: < 1% objetivo
- **Bundle Size**: Monitorizar crecimiento

### Infrastructure Metrics

#### Vercel Platform
- **Build Time**: < 30 segundos
- **Deploy Success Rate**: 99% objetivo
- **Edge Response Time**: < 100ms
- **Cache Hit Rate**: > 80%

#### GitHub Integration
- **Build Trigger Time**: < 1 minuto
- **Sync Status**: Real-time verification
- **Webhook Response**: < 5 segundos

## Herramientas de Monitorización

### Vercel Analytics

#### Access
1. Panel Vercel: https://vercel.com/rpmsysadim-5965s-projects/rpm
2. Tab "Analytics"
3. Métricas en tiempo real y históricas

#### Métricas Disponibles
- **Page Views**: Tráfico total y usuarios únicos
- **Web Vitals**: Desglose por página
- **Speed Insights**: Análisis de velocidad
- **Device/Browser**: Segmentación por dispositivo
- **Geography**: Distribución geográfica

#### Configuración
```javascript
// vercel.json (opcional)
{
  "analytics": {
    "enabled": true,
    "exclude": ["/api/*"]
  }
}
```

### Vercel Logs

#### Tipos de Logs
- **Build Logs**: Proceso de construcción
- **Function Logs**: Serverless functions
- **Real-time Logs**: Streaming en vivo
- **Historical Logs**: Archivo histórico

#### Access Methods
```bash
# CLI - Logs recientes
vercel logs

# CLI - Logs específicos
vercel logs --since=1h

# Panel - Interface gráfica
# https://vercel.com/rpmsysadim-5965s-projects/rpm/logs
```

### Health Checks

#### Automated Checks
- **URL Availability**: Verificación cada 5 minutos
- **SSL Certificate**: Monitorización automática
- **Domain Resolution**: Verificación DNS
- **Build Status**: Estado de despliegues

#### Manual Health Checks
```bash
# Verificar disponibilidad
curl -I https://rpm-wheat.vercel.app

# Verificar response time
curl -w "@curl-format.txt" -o /dev/null -s https://rpm-wheat.vercel.app

# Verificar SSL
openssl s_client -connect rpm-wheat.vercel.app:443
```

## Configuración de Alerts

### Vercel Alerts

#### Build Alerts
- **Build Failures**: Email automático
- **Deploy Failures**: Notificación inmediata
- **Performance Degradation**: Alertas de Web Vitals

#### Setup
1. Panel Vercel → Settings → Notifications
2. Configurar email: rpm.sysadim@gmail.com
3. Seleccionar tipos de alertas

### Custom Monitoring

#### External Monitoring Services
```bash
# Uptime Robot (ejemplo)
# URL: https://rpm-wheat.vercel.app
# Check interval: 5 minutes
# Alert contacts: rpm.sysadim@gmail.com
```

#### Custom Health Endpoint
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
}
```

## Diagnóstico y Troubleshooting

### Performance Issues

#### Identificación
1. **Vercel Analytics**: Pages con bajo rendimiento
2. **Web Vitals**: Métricas específicas afectadas
3. **Network Tab**: Tiempos de carga en browser
4. **Bundle Analysis**: Tamaño y composición del bundle

#### Soluciones Comunes
```bash
# Bundle analysis
npx @next/bundle-analyzer

# Image optimization
# Verificar next/image usage

# Code splitting
# Verificar dynamic imports
```

### Build Issues

#### Diagnóstico
```bash
# Build local
pnpm build

# Verificar dependencias
pnpm ls

# Limpiar caché
rm -rf .next && pnpm install
```

#### Common Build Errors
- **Memory Issues**: Aumentar Node memory
- **Dependency Conflicts**: Revisar package.json
- **TypeScript Errors**: Verificar tsconfig.json

### Deploy Issues

#### Verificación
```bash
# Git status
git status

# Remote verification
git remote -v

# Vercel link verification
vercel ls
```

## Reporting y Dashboards

### Weekly Report Template

#### Metrics Summary
```markdown
## Weekly Performance Report - RPM

### Availability
- Uptime: 99.95%
- Downtime incidents: 0
- Response time avg: 145ms

### Performance  
- LCP: 1.8s ✅
- INP: 120ms ✅  
- CLS: 0.05 ✅

### Traffic
- Page views: 2,543
- Unique users: 1,234
- Bounce rate: 32%

### Builds
- Total builds: 14
- Success rate: 100%
- Avg build time: 23s
```

### Dashboard Setup

#### Vercel Dashboard
- **URL**: https://vercel.com/rpmsysadim-5965s-projects/rpm
- **Tabs**: Overview, Analytics, Logs, Settings
- **Alerts**: Configurados para email

#### Custom Dashboard (opcional)
```typescript
// app/admin/dashboard/page.tsx
// Dashboard personalizado con métricas en tiempo real
```

## Automatización

### Scripts de Monitorización

#### Health Check Script
```bash
#!/bin/bash
# health-check.sh

URL="https://rpm-wheat.vercel.app"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -eq 200 ]; then
    echo "✅ Health check passed - $(date)"
else
    echo "❌ Health check failed - HTTP $RESPONSE"
    # Send alert
    echo "RPM health check failed" | mail -s "Health Alert" rpm.sysadim@gmail.com
fi
```

#### Performance Monitoring
```bash
#!/bin/bash
# performance-check.sh

URL="https://rpm-wheat.vercel.app"
METRICS=$(curl -w "@curl-format.txt" -o /dev/null -s $URL)

echo "$METRICS" >> performance.log
```

### Cron Jobs
```bash
# Crontab entries
# Health check cada 5 minutos
*/5 * * * * /path/to/health-check.sh

# Performance report diario
0 8 * * * /path/to/performance-report.sh
```

## Escalation Procedures

### Incident Levels

#### Level 1 - Minor
- **Impact**: < 5% usuarios afectados
- **Response**: 1 hora
- **Actions**: Investigación básica, restart si necesario

#### Level 2 - Major  
- **Impact**: 5-20% usuarios afectados
- **Response**: 30 minutos
- **Actions**: Hotfix, comunicación parcial

#### Level 3 - Critical
- **Impact**: > 20% usuarios afectados
- **Response**: 15 minutos
- **Actions**: Rollback inmediato, comunicación completa

### Communication Protocol

#### Internal Communication
- **Slack/Teams**: Canal #rpm-monitoring
- **Email**: rpm.sysadim@gmail.com
- **GitHub**: Issues y PRs

#### External Communication
- **Stakeholders**: Email con status updates
- **Users**: Banner en aplicación si downtime > 30min

## Contactos y Recursos

### Team Contacts
- **On-call Engineer**: rpm.sysadim@gmail.com
- **GitHub Admin**: galiprandi
- **Vercel Support**: Through panel

### Documentation Links
- [Vercel Analytics Guide](https://vercel.com/docs/analytics)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web Vitals Guide](https://web.dev/vitals/)
- [System Specifications](../specs/vercel-deployment.md)

### Tools and Services
- **Vercel**: https://vercel.com
- **GitHub**: https://github.com/galiprandi/rpm
- **Google PageSpeed**: https://pagespeed.web.dev
- **WebPageTest**: https://webpagetest.org

## Maintenance Schedule

### Daily
- [ ] Review build status
- [ ] Check error logs
- [ ] Verify uptime

### Weekly  
- [ ] Performance metrics review
- [ ] Security scan
- [ ] Dependency updates

### Monthly
- [ ] Full system audit
- [ ] Performance optimization
- [ ] Documentation update
