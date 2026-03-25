# Especificación de Despliegue en Vercel

## Overview

Esta especificación detalla el proceso de despliegue, configuración y monitorización de la aplicación RPM en la plataforma Vercel.

## Configuración del Despliegue

### Información del Proyecto

#### Datos del Repositorio
- **Repository URL**: https://github.com/galiprandi/rpm
- **GitHub Owner**: galiprandi
- **GitHub Collaborator**: rpmsysadim
- **Branch Principal**: main
- **Stack**: Next.js 16.2.1 + React 19.2.4

#### Datos de Vercel
- **Cuenta**: rpm.sysadim@gmail.com
- **Scope**: rpmsysadim-5965s-projects
- **Project ID**: prj_xDmpvzobb8VhHmd7RhEg0pDB7ruE
- **Project Name**: rpm

#### URLs de Producción
- **URL Principal**: https://rpm-wheat.vercel.app
- **URL Directa**: https://rpm-8f53y9g4t-rpmsysadim-5965s-projects.vercel.app
- **Panel de Control**: https://vercel.com/rpmsysadim-5965s-projects/rpm/settings

### Configuración Técnica

#### Build Settings
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev", 
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "nodeVersion": "24.x"
}
```

#### Environment Variables
- **Development**: Variables descargadas automáticamente
- **Production**: Gestionadas en panel Vercel
- **Preview**: Variables específicas para previews

#### Domain Configuration
- **Primary Domain**: rpm-wheat.vercel.app
- **Custom Domains**: No configurados actualmente
- **SSL**: Automático por Vercel

## Flujo de Despliegue

### Despliegue Automático (CI/CD)

#### Trigger Conditions
1. **Push a main branch**: Despliegue automático a producción
2. **Pull Requests**: Despliegue automático a preview
3. **Manual Deploy**: Disponible desde panel Vercel

#### Process Flow
```
GitHub Push → Vercel Webhook → Build Process → Deploy → Health Check → URL Update
```

#### Build Process
1. **Install Dependencies**: `npm install` (o `pnpm install`)
2. **Build Application**: `npm run build`
3. **Optimize Assets**: Optimización automática de Vercel
4. **Deploy**: Despliegue a Edge Network

#### Deployment Types
- **Production**: `main` branch → https://rpm-wheat.vercel.app
- **Preview**: PR branches → URLs temporales
- **Canary**: Despliegues graduales (configurable)

### Configuración Local

#### Vercel CLI Setup
```bash
# Instalación
npm i -g vercel

# Login
vercel login

# Link proyecto
vercel link

# Deploy local
vercel --prod
```

#### Archivos de Configuración
- `.vercel/project.json`: Configuración del proyecto
- `.env.local`: Variables de entorno local
- `vercel.json`: Configuración personalizada (opcional)

## Monitorización y Salud

### Métricas de Despliegue

#### Build Metrics
- **Build Duration**: < 30 segundos objetivo
- **Build Success Rate**: 99% objetivo
- **Bundle Size**: Monitorizar crecimiento
- **Dependencies**: Actualizaciones y vulnerabilidades

#### Performance Metrics
- **Core Web Vitals**: LCP < 2.5s, INP < 200ms, CLS < 0.1
- **Uptime**: 99.9% objetivo
- **Response Time**: < 200ms promedio
- **Error Rate**: < 1% objetivo

### Herramientas de Monitorización

#### Vercel Analytics
- **Page Views**: Tráfico y usuarios únicos
- **Web Vitals**: Métricas de rendimiento
- **Speed Insights**: Análisis de velocidad
- **Build Times**: Historial de builds

#### Logs y Debugging
- **Build Logs**: Disponibles en panel Vercel
- **Function Logs**: Serverless functions execution
- **Real-time Logs**: Streaming en tiempo real
- **Error Tracking**: Agregación de errores

### Health Checks

#### Automated Health Checks
- **URL Availability**: Verificación cada 5 minutos
- **SSL Certificate**: Monitorización automática
- **Domain Resolution**: Verificación DNS
- **Build Status**: Estado de despliegues

#### Manual Health Checks
```bash
# Verificar URL
curl -I https://rpm-wheat.vercel.app

# Verificar build status
vercel ls

# Verificar logs
vercel logs
```

## Componentes de la Aplicación

### Frontend Architecture

#### Next.js App Router
```
app/
├── layout.tsx          # Layout principal
├── page.tsx           # Homepage
├── globals.css        # Estilos globales
└── (components)/      # Componentes de UI
```

#### Dependencies Management
```json
{
  "dependencies": {
    "next": "16.2.1",
    "react": "19.2.4", 
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

### Infrastructure Components

#### Vercel Edge Network
- **Global CDN**: Distribución mundial
- **Edge Functions**: Serverless en edge locations
- **Static Assets**: Optimización automática
- **Image Optimization**: WebP y resizing

#### Build Platform
- **Parallel Builds**: Múltiples workers
- **Caching Inteligente**: Cache de dependencias
- **Incremental Builds**: Solo cambios relevantes
- **Parallel Deploys**: Despliegues concurrentes

## Seguridad

### Access Management

#### GitHub Permissions
- **Repository Access**: Collaborator level para rpmsysadim
- **Branch Protection**: Configurar para main branch
- **Required Reviews**: Opcional para producción
- **Status Checks**: Build exitoso requerido

#### Vercel Security
- **Team Management**: rpmsysadim-5965s-projects
- **Environment Variables**: Encriptadas y aisladas
- **Domain Security**: HTTPS forzado
- **Access Logs**: Auditoría de accesos

### Security Best Practices

#### Application Security
- **Environment Variables**: Nunca en client-side code
- **Dependencies**: Regular security audits
- **Headers**: Security headers configurados
- **Dependencies Scanning**: Automático en Vercel

#### Infrastructure Security
- **Network**: Vercel Edge Network security
- **Data Privacy**: GDPR compliant
- **Backup**: Automático y versionado
- **Disaster Recovery**: Procedimientos establecidos

## Mantenimiento y Operaciones

### Regular Maintenance

#### Weekly Tasks
- [ ] Revisión de builds fallidos
- [ ] Actualización de dependencias
- [ ] Monitorización de métricas
- [ ] Revisión de logs de errores

#### Monthly Tasks
- [ ] Actualización mayor de dependencias
- [ ] Revisión de seguridad
- [ ] Optimización de performance
- [ ] Documentación updates

### Incident Management

#### Common Issues
1. **Build Failures**: Revisión de logs y dependencias
2. **Performance Issues**: Análisis de Web Vitals
3. **Deployment Failures**: Verificación de configuración
4. **DNS Issues**: Verificación de domain settings

#### Escalation Procedures
1. **Level 1**: Revisión básica y restart
2. **Level 2**: Debugging profundo y hotfix
3. **Level 3**: Rollback y comunicación
4. **Level 4**: Escalación a stakeholders

## Comandos y Scripts Útiles

### Vercel CLI Commands
```bash
# Ver proyectos
vercel projects ls

# Ver builds recientes
vercel logs

# Deploy manual
vercel --prod

# Verificar entorno
vercel env ls

# Debug local
vercel dev
```

### GitHub Commands
```bash
# Ver status
git status

# Push con deploy automático
git add . && git commit -m "deploy" && git push

# Verificar remotes
git remote -v
```

## Contactos y Comunicación

### Team Roles
| Rol | Contacto | Responsabilidades |
|-----|----------|-------------------|
| GitHub Admin | galiprandi | Repository management |
| Vercel Admin | rpm.sysadim@gmail.com | Deployment and monitoring |
| Developer | rpmsysadim | Development and maintenance |

### Communication Channels
- **Urgent Issues**: Email a rpm.sysadim@gmail.com
- **Regular Updates**: GitHub commits y PRs
- **Monitoring Alerts**: Vercel notifications
- **Documentation**: Wiki y specs

## Vinculación con Documentación

### Especificaciones Relacionadas
- `/specs/SYSTEM_SPEC.md` - Arquitectura general
- `/docs/monitoring.md` - Guía de monitorización detallada
- `/docs/troubleshooting.md` - Guía de troubleshooting

## Tests y Validación

### Tests Unitarios
- **health.test.ts**: Validación de funcionalidad principal
  - Cobertura: 80% 
  - Tests: 5/5 pasando
  - Performance: <100ms de respuesta
  - Especificaciones: `/docs/monitoring.md#health-checks`

### Tests de Integración
- **Deploy Tests**: Validación de despliegue
- **Health Tests**: Validación de health checks
- **Performance Tests**: Métricas de rendimiento

### Vinculación Activa
- Última actualización: 2025-03-25
- Estado tests: 🟢 Todos pasando
- Cobertura: 80% (objetivo >90%)

### Actualización de Especificación
- **Last Updated**: 2025-03-25
- **Next Review**: 2025-04-25
- **Version**: 1.0.0
- **Status**: Active
