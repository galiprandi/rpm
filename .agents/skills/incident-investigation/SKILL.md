---
name: incident-investigation
description: Procedimiento establecido para investigar bugs, errores e incidentes reportados por clientes. Recabar contexto de Vercel, Sentry, Neon y Git antes de proponer un fix.
---

# Incident Investigation

Procedimiento obligatorio cuando un cliente reporta un bug, error o incidente.

## Cuándo usar esta skill

- Un cliente reporta un problema ("no funciona X", "tengo error en Y", "Z desapareció")
- Se detecta un comportamiento inesperado en producción
- Sentry alerta de un error nuevo en Discord

## Configuración del ambiente

Todos los tokens y credenciales viven en `.env.local` o `.envrc.local` (no commiteados). Los CLIs los leen de ahí.

### Vercel

- **Auth:** `VERCEL_TOKEN` exportado por direnv desde `.envrc.local` (pisa el token global de galiprandi)
- **Scope:** `rpmsysadim-5965s-projects` — el proyecto vive en la cuenta rpm, no en galiprandi
- **Project:** `.vercel/project.json` linkeado a `rpmsysadim-5965s-projects/rpm` (auto-generado por `vercel link --scope`)
- **CLI:** `vercel` lee `VERCEL_TOKEN` del entorno nativamente — **NUNCA pasar `--token` como flag** (expone el token en shell history)
- **Regla crítica:** Siempre hacer `unset VERCEL_TOKEN && source .envrc.local` antes de comandos vercel en este repo, para pisar el token de galiprandi que viene de `~/Github/Personal/.envrc.local`

### Sentry CLI

- **Token:** `SENTRY_AUTH_TOKEN` en `.env.local`
- **Org/Project:** `.sentryclirc` en la raíz del repo (commiteado, sin secretos)
- **Scripts:** `pnpm sentry:issues`, `pnpm sentry:releases`, `pnpm sentry:info`
- **Cómo funciona:** `dotenv-cli` carga `.env.local` y pasa el token a `npx sentry-cli`

### Neon (PostgreSQL)

- **Connection string:** `DATABASE_URL` en `.env.local`
- **CLI:** `npx neon` o Neon MCP server (`Neon 💾` en Devin)
- **psql local:** `pnpm exec dotenv -e .env.local -- bash -c 'psql "$DATABASE_URL" -c "<query>"'`
- **Regla:** Solo queries de lectura durante investigación. Nunca modificar datos sin confirmación.

### Git

- **Auth:** SSH keys configurados en `~/.ssh/` o token HTTPS en git config
- **Remote:** `github.com-personal:galiprandi/rpm.git` (SSH)
- **Comandos directos:** `git log`, `git diff`, `git blame` — sin auth extra

### Chrome MCP

- **Perfil:** `Chrome perfil RPM` en Devin MCP config
- **Acceso:** Navegación a URLs de producción (`https://rpm-wheat.vercel.app/`) y dashboards (Sentry, Vercel)
- **Uso:** Solo como último recurso para reproducir errores visualmente o cuando CLI no alcanza
- **Sin tokens:** Usa la sesión del browser, no necesita credenciales aparte

## Flujo de investigación

### Step 1: Vercel CLI — logs de runtime y deploys

Fuente primaria de pistas. Los logs de runtime muestran cada request con status code, ruta, host, mensajes de consola y traces.

```bash
# SIEMPRE pisar el token global antes de comandos vercel en este repo
unset VERCEL_TOKEN && source .envrc.local

# Errores 5xx en las últimas 24h (ajustar ventana temporal según el reporte)
vercel logs --status-code 5xx --limit 50 --since 24h

# Errores 4xx (pueden indicar bugs de routing o auth)
vercel logs --status-code 4xx --limit 50 --since 24h

# Filtrar por nivel de log (error, warning, fatal)
vercel logs --level error --limit 50 --since 24h

# Buscar por query avanzada (status + ruta + mensaje)
vercel logs --query "status:500 /api/" --limit 50 --since 24h

# Logs en vivo (streaming) para reproducir un error en tiempo real
vercel logs --follow

# Output en JSON para piping a jq u otros tools
vercel logs --status-code 5xx --json --limit 100 --since 7d | jq '.[] | {status, path, message}'

# Últimos deploys (para cruzar timestamps)
vercel ls --scope rpmsysadim-5965s-projects --format json

# Inspeccionar un deploy específico con logs de build
vercel inspect <deployment-url> --logs
```

Filtros útiles de `vercel logs`:
- `--status-code 500` / `--status-code 5xx` / `--status-code 4xx`
- `--level error` / `--level fatal` / `--level warning`
- `--since 1h` / `--since 24h` / `--since 7d` (relativo) o ISO format
- `--query "status:500 path:/api/ error"` (query avanzada)
- `--branch main` / `--environment production`
- `--source serverless` / `--source edge-function` / `--source edge-middleware`

Si hay logs relevantes, anotar:
- Timestamp del error
- Status code
- Ruta afectada (`/api/...`, página SSR, etc.)
- Mensaje de error o stack trace
- Request ID (para investigar más a fondo)

### Step 2: Sentry — errores capturados y stack traces

Sentry complementa los logs de Vercel con stack traces completos, breadcrumbs y contexto del usuario.

```bash
pnpm sentry:issues
```

Buscar issues que coincidan con el reporte del cliente por:
- Título del error
- Timestamp (¿cuándo pasó vs cuándo reportó?)
- URL donde ocurrió (si el cliente la provee)

Cruzar con los errores encontrados en Step 1:
- Si Vercel muestra un 500 y Sentry tiene un issue con el mismo timestamp → confirmar el stack trace
- Si Vercel muestra un 500 pero Sentry no tiene issues → el error no fue capturado por Sentry (posible bug en el middleware de captura)

Si hay un issue relevante, anotar:
- Issue ID (ej: `RPM-5`)
- Short ID
- Título
- Last seen
- Status

### Step 3: Neon — verificación de datos

Solo si el incidente puede estar relacionado con datos:
- "No veo tal producto/cliente/OT"
- "Los precios están mal"
- "El stock no coincide"

```bash
# Conexión a DB via .env.local
pnpm exec dotenv -e .env.local -- bash -c 'psql "$DATABASE_URL" -c "SELECT id, name, active FROM product WHERE name ILIKE '\''%<nombre>%'\''"'

# O usar Neon MCP server si está disponible
```

Ejemplos (tablas son singulares: `product`, `price_list_item`, `work_order`):
- Producto desaparecido: `SELECT id, name, active FROM product WHERE name ILIKE '%<nombre>%'`
- Precio incorrecto: `SELECT * FROM price_list_item WHERE product_id = '<id>'`
- OT no aparece: `SELECT id, status, created_at FROM work_order WHERE customer_id = '<id>' ORDER BY created_at DESC LIMIT 5`

### Step 4: Git — cambios recientes

```bash
git log --oneline -20
git log --since="2 days ago" --oneline
```

Si el error empezó después de un deploy, identificar el commit:
- `git log --oneline <deploy-sha>~1..<deploy-sha>`
- Revisar el diff: `git diff <sha-anterior>..<deploy-sha> -- <directorio-relacionado>`

### Step 5: Chrome MCP — reproducción visual (último recurso)

Solo si los pasos anteriores no dan suficiente contexto:
- Navegar a la URL afectada (`https://rpm-wheat.vercel.app/...`)
- Reproducir el flujo que reporta el cliente
- Capturar console errors y network failures con `browser_console_messages`
- Verificar visualmente el estado de la UI

No usar Chrome MCP para revisar dashboards de Vercel o Sentry — los CLIs son más confiables y rápidos.

### Step 6: Síntesis

Antes de proponer cualquier fix, presentar al usuario:

```
## Diagnóstico

**Reporte del cliente:** <descripción>

**Vercel:** <errores encontrados en logs — status, ruta, timestamp, mensaje>
**Sentry:** Issue RPM-X "<título>" — last seen <fecha> — <status>
**Neon:** <resultado de query relevante, si aplica>
**Git:** Último cambio relevante: <sha> "<mensaje>"

**Hipótesis:** <qué creemos que pasó>
**Evidencia:** <qué datos respaldan la hipótesis>
**Acción propuesta:** <qué hacer al respecto>
```

## Reglas

- **NUNCA proponer un fix sin haber completado al menos Step 1 y 2**
- **NUNCA pasar `VERCEL_TOKEN` como `--token` flag** — exportarlo como env var y dejar que el CLI lo lea nativamente
- **SIEMPRE hacer `unset VERCEL_TOKEN && source .envrc.local`** antes de comandos vercel en este repo
- Si Vercel logs no muestran errores → el problema puede ser de UI, de datos, o no reproducible
- Si Vercel tiene un deploy fallido → priorizar arreglar el deploy antes que el bug
- Si Sentry tiene un issue pero Vercel logs no muestran el error → posible captura duplicada o error en client-side
- Si el issue está en Sentry pero resuelto → preguntar al cliente si sigue pasando
- Si se necesita acceso a la DB, usar queries de solo lectura primero
- Si el incidente es crítico (app caída, datos perdidos), escalar inmediatamente sin esperar al flujo completo

## Herramientas disponibles

| Herramienta | Comando | Auth | Para qué |
|---|---|---|---|
| Vercel CLI | `vercel logs --status-code 5xx` | `VERCEL_TOKEN` en `.envrc.local` | Logs de runtime, errores 500, traces |
| Vercel CLI | `vercel ls --format json` | `VERCEL_TOKEN` en `.envrc.local` | Listar deploys, cruzar timestamps |
| Vercel CLI | `vercel inspect <url> --logs` | `VERCEL_TOKEN` en `.envrc.local` | Logs de build de un deploy específico |
| Sentry CLI | `pnpm sentry:issues` | `SENTRY_AUTH_TOKEN` en `.env.local` | Ver errores capturados con stack traces |
| Sentry CLI | `pnpm sentry:releases` | `SENTRY_AUTH_TOKEN` en `.env.local` | Ver releases y source maps |
| Neon | `pnpm exec dotenv -e .env.local -- bash -c 'psql "$DATABASE_URL" ...'` | `DATABASE_URL` en `.env.local` | Queries a la BD |
| Neon MCP | `Neon 💾` server en Devin | OAuth | Queries a la BD |
| Git | `git log`, `git diff` | SSH keys | Cambios recientes |
| Chrome MCP | Navegar a la URL afectada | Sesión del browser | Reproducir el error visualmente (último recurso) |
