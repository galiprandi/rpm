# Arquitectura de Operaciones (Ops), Despliegue y Escalamiento

## 1. Despliegue (Deployment)
- **Plataforma**: Vercel.
- **CI/CD**: Integración continua automática desde la rama `main` en GitHub.
- **Variables de Entorno**: Gestionadas en el panel de Vercel (Secrets) y NUNCA en el código (asegurarse de que el `.env` local nunca se suba al repo).
- **Proceso de Build**: En Vercel, el comando de build incluye la ejecución de migraciones de Prisma (`npx prisma migrate deploy`) antes de construir el bundle de Next.js.

## 2. Gestión de Imágenes y CDN
- **Almacenamiento Local (Desarrollo)**: Durante el desarrollo, las imágenes pueden guardarse en `/public/uploads`.
- **Almacenamiento Producción**: Integración con servicios de CDN (ej. Cloudflare R2, AWS S3 o Github CDN service si aplica) para evitar llenar el disco efímero de Vercel, dado que Vercel Functions es serverless y no persiste archivos locales modificados en tiempo de ejecución.
- **Optimización**: Se prefiere formato `WebP` o compresión previa a la subida de imágenes pesadas.

## 3. Escalabilidad
- **Base de Datos**: PostgreSQL alojado preferentemente con un proveedor gestionado (Supabase, Neon, AWS RDS) que soporte pool de conexiones adecuado (PGBouncer o el propio manejador de Prisma Accelerate/Data Proxy) ya que Vercel Serverless puede generar múltiples conexiones simultáneas rápidas.
- **Cacheo de API**: Utilizar el caché integrado de Next.js para listas de solo lectura, minimizando golpes a la base de datos.
- **Manejo de Tareas Asíncronas**: Tareas pesadas como envío masivo de correos o generación de PDFs deben ejecutarse sin bloquear el request del cliente (o delegarse a jobs/cron en caso de ser muy extensas).

## 4. Estándares de Formateo
- **Código**: Prettier y ESLint estrictos en CI/CD (o localmente con Husky) antes del commit.
- **Bot Nitro**: El bot de IA tiene reglas específicas de formato (Markdown con tablas y alertas cortas) definidas en su prompt de sistema para que la información que presenta al técnico en pantallas móviles sea rápidamente escaneable.
