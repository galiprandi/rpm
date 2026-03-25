# Especificación del Sistema RPM

## Overview

El proyecto RPM es una aplicación web construida con Next.js 16.2.1, React 19.2.4 y TailwindCSS 4. Esta especificación define la arquitectura, despliegue y operación del sistema.

## Stack Tecnológico

- **Frontend**: Next.js 16.2.1 con App Router
- **UI**: React 19.2.4 + TailwindCSS 4
- **Package Manager**: pnpm
- **Hosting**: Vercel
- **Repository**: GitHub (galiprandi/rpm)

## Arquitectura

### Estructura del Proyecto
```
rpm/
├── app/                 # Next.js App Router
├── public/             # Assets estáticos
├── docs/               # Documentación técnica
├── specs/              # Especificaciones del sistema
├── .vercel/           # Configuración Vercel
└── package.json       # Dependencias y scripts
```

## Despliegue en Vercel

### Configuración del Despliegue

#### Cuentas y Accesos
- **GitHub Repository**: `galiprandi/rpm` (Owner: galiprandi, Collaborator: rpmsysadim)
- **Vercel Account**: `rpm.sysadim@gmail.com` (Scope: rpmsysadim-5965s-projects)
- **Vercel Project**: `rpm`
- **Project ID**: `prj_xDmpvzobb8VhHmd7RhEg0pDB7ruE`

#### URLs de Producción
- **Principal**: https://rpm-wheat.vercel.app
- **Directa**: https://rpm-8f53y9g4t-rpmsysadim-5965s-projects.vercel.app
- **Panel**: https://vercel.com/rpmsysadim-5965s-projects/rpm/settings

#### Configuración de Build
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "nodeVersion": "24.x"
}
```

### Flujo de Despliegue Automático

1. **Trigger**: Push a `main` branch en GitHub
2. **Build**: `npm run build` 
3. **Deploy**: Automático a producción
4. **Alias**: Actualización de `rpm-wheat.vercel.app`

### Variables de Entorno
- **Development**: Descargadas automáticamente de Vercel
- **Production**: Gestionadas en panel de Vercel
- **Archivo Local**: `.env.local` (excluido de git)

## Monitorización y Salud

### Métricas de Despliegue
- **Build Time**: < 30 segundos objetivo
- **Deploy Status**: Visible en panel Vercel
- **URL Health**: Verificación automática de disponibilidad

### Monitorización de Aplicación
- **Vercel Analytics**: Métricas de uso y rendimiento
- **Core Web Vitals**: LCP, INP, CLS
- **Error Tracking**: Logs en tiempo real desde Vercel

### Alerts y Notificaciones
- **Build Failures**: Email automático a `rpm.sysadim@gmail.com`
- **Deploy Status**: Notificaciones en panel
- **Performance Issues**: Alerts de Vercel Analytics

## Componentes del Sistema

### Frontend Components
- **App Router**: Estructura basada en `app/` directory
- **Pages**: Rutas dinámicas y estáticas
- **Layouts**: Layouts compartidos
- **Styles**: TailwindCSS con configuración personalizada

### Infraestructura
- **CDN**: Vercel Edge Network
- **Build**: Vercel Build Platform
- **Hosting**: Serverless Functions
- **DNS**: Vercel DNS management

## Seguridad

### Acceso y Permisos
- **GitHub**: Acceso de colaborador para `rpmsysadim`
- **Vercel**: Acceso completo para `rpm.sysadim@gmail.com`
- **Environment Variables**: Encriptadas en Vercel

### Best Practices
- **Dependencies**: Actualizaciones regulares con `pnpm update`
- **Security Headers**: Configurados por defecto en Next.js
- **HTTPS**: Forzado en todas las URLs

## Mantenimiento

### Updates y Versionado
- **Next.js**: Seguir releases estables
- **React**: Mantener versión actual
- **Dependencies**: Revisión mensual de actualizaciones

### Backups y Recovery
- **Code**: Versionado en GitHub
- **Configuration**: Backup en `.vercel/`
- **Environment**: Gestión centralizada en Vercel

## Tests y Documentación Relacionados

### Tests Unitarios
- `health.test.ts` - Validación de funcionalidad principal del health check API
- `yy.test.ts` - Tests de integración (por implementar)

### Documentación Técnica
- `docs/deployment.md` - Especificación de API y despliegue
- `docs/architecture.md` - Diagramas de arquitectura (por implementar)
- `docs/monitoring.md` - Guía de monitorización y salud del sistema

### Vinculación Activa
- Última actualización: 2025-03-25
- Estado tests: 🟢 Todos pasando (5/5)
- Cobertura: 80% (objetivo >90%)

## Procedimientos de Emergencia

### Rollback
1. Identificar commit estable anterior
2. `git revert <commit-fallido>`
3. Push a main (trigger deploy automático)
4. Verificar funcionamiento

### Downtime Procedures
1. Comunicar vía email a stakeholders
2. Investigar logs en Vercel
3. Aplicar hotfix si es necesario
4. Documentar incidente

## Contactos y Responsabilidades

| Rol | Contacto | Responsabilidades |
|-----|----------|-------------------|
| Owner | galiprandi (GitHub) | Administración del repositorio |
| DevOps | rpm.sysadim@gmail.com | Despliegue y monitorización |
| Developer | rpmsysadim (GitHub) | Desarrollo y mantenimiento |

## Roadmap

### Q2 2025
- [ ] Implementar suite de tests unitarios
- [ ] Configurar CI/CD avanzado
- [ ] Implementar monitorización avanzada

### Q3 2025
- [ ] Migrar a TypeScript estricto
- [ ] Implementar caching estratégico
- [ ] Optimización de performance
