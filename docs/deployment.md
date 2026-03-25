# Guía de Despliegue - RPM en Vercel

## Quick Start

### Despliegue Automático
El proyecto está configurado para despliegue automático. Simplemente haz push a la rama `main`:

```bash
git add .
git commit -m "tu mensaje"
git push origin main
```

### Despliegue Manual
Para despliegues manuales o pruebas:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login (solo primera vez)
vercel login

# Deploy a producción
vercel --prod
```

## URLs del Proyecto

- **Producción**: https://rpm-wheat.vercel.app
- **Panel Vercel**: https://vercel.com/rpmsysadim-5965s-projects/rpm
- **Repositorio**: https://github.com/galiprandi/rpm

## Configuración del Entorno

### Cuentas
- **GitHub**: galiprandi/rpm (Owner: galiprandi, Collaborator: rpmsysadim)
- **Vercel**: rpm.sysadim@gmail.com (Scope: rpmsysadim-5965s-projects)

### Variables de Entorno
Las variables de entorno se gestionan desde el panel de Vercel:
1. Ve a https://vercel.com/rpmsysadim-5965s-projects/rpm/settings/environment-variables
2. Agrega las variables necesarias
3. Se sincronizan automáticamente en cada despliegue

## Flujo de Trabajo

### 1. Desarrollo Local
```bash
# Instalar dependencias
pnpm install

# Iniciar desarrollo
pnpm dev
```

### 2. Testing y Validación
```bash
# Build test
pnpm build

# Linting
pnpm lint
```

### 3. Despliegue
```bash
# Commit y push (despliegue automático)
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

## Monitorización

### Build Status
- **Panel Vercel**: https://vercel.com/rpmsysadim-5965s-projects/rpm
- **Build Logs**: Disponibles en cada despliegue
- **Error Tracking**: Integrado con Vercel

### Performance Metrics
- **Vercel Analytics**: Métricas de uso y rendimiento
- **Core Web Vitals**: LCP, INP, CLS
- **Uptime Monitoring**: Disponibilidad 24/7

## Troubleshooting

### Build Failures
1. **Verificar logs**: Panel Vercel → Deploy → View Logs
2. **Local testing**: `pnpm build` localmente
3. **Dependencies**: `pnpm install` para limpiar caché
4. **Node version**: Verificar versión 24.x

### Deploy Issues
1. **GitHub sync**: Verificar conexión del repositorio
2. **Permissions**: Confirmar acceso al repo
3. **Environment variables**: Verificar configuración
4. **Domain issues**: Verificar configuración DNS

### Performance Issues
1. **Bundle size**: Analizar tamaño del bundle
2. **Images**: Optimizar imágenes
3. **Caching**: Verificar configuración de cache
4. **CDN**: Verificar distribución Edge

## Comandos Útiles

### Vercel CLI
```bash
# Ver proyectos
vercel projects ls

# Ver logs recientes
vercel logs

# Ver variables de entorno
vercel env ls

# Status del proyecto
vercel ls
```

### Git Commands
```bash
# Ver status
git status

# Ver remotes
git remote -v

# Ver commits recientes
git log --oneline -5
```

## Emergency Procedures

### Rollback
```bash
# Revertir último commit
git revert HEAD

# Forzar rollback
git push --force-with-lease
```

### Hotfix
```bash
# Branch de hotfix
git checkout -b hotfix/issue-name

# Fix y deploy
git add . && git commit -m "hotfix: descripción"
git push origin hotfix/issue-name
```

## Best Practices

### Development
- **Commits descriptivos**: Usar conventional commits
- **Branch protection**: Proteger rama main
- **Code reviews**: PRs para cambios importantes
- **Testing**: Validar antes de desplegar

### Deployment
- **Environment variables**: Nunca en código
- **Dependencies**: Actualizar regularmente
- **Security**: Revisión periódica de dependencias
- **Performance**: Monitorizar métricas regularmente

## Contactos

- **Vercel Admin**: rpm.sysadim@gmail.com
- **GitHub Admin**: galiprandi
- **Developer**: rpmsysadim

## URLs del Sitio

### Producción
- **URL Principal**: https://rpm-wheat.vercel.app
- **URL Directa**: https://rpm-8f53y9g4t-rpmsysadim-5965s-projects.vercel.app

### Administración
- **Panel Vercel**: https://vercel.com/rpmsysadim-5965s-projects/rpm
- **Settings**: https://vercel.com/rpmsysadim-5965s-projects/rpm/settings
- **Analytics**: https://vercel.com/rpmsysadim-5965s-projects/rpm/analytics
- **Logs**: https://vercel.com/rpmsysadim-5965s-projects/rpm/logs

### Repositorio
- **GitHub**: https://github.com/galiprandi/rpm
- **Issues**: https://github.com/galiprandi/rpm/issues
- **Pull Requests**: https://github.com/galiprandi/rpm/pulls

### Testing y Validación
- **Health Check**: https://rpm-wheat.vercel.app/api/health
- **PageSpeed Insights**: https://pagespeed.web.dev/report?url=https://rpm-wheat.vercel.app
- **WebPageTest**: https://webpagetest.org/?url=https://rpm-wheat.vercel.app

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Project Specifications](../specs/vercel-deployment.md)
