---
name: incident-investigation
description: Procedimiento establecido para investigar bugs, errores e incidentes reportados por clientes. Recabar contexto de Sentry, Vercel, Neon y Git antes de proponer un fix.
---

# Incident Investigation

Procedimiento obligatorio cuando un cliente reporta un bug, error o incidente.

## Cuándo usar esta skill

- Un cliente reporta un problema ("no funciona X", "tengo error en Y", "Z desapareció")
- Se detecta un comportamiento inesperado en producción
- Sentry alerta de un error nuevo en Discord

## Flujo de investigación

### Step 1: Sentry — errores recientes

```bash
pnpm sentry:issues
```

Buscar issues que coincidan con el reporte del cliente por:
- Título del error
- Timestamp (¿cuándo pasó vs cuándo reportó?)
- URL donde ocurrió (si el cliente la provee)

Si hay un issue relevante, anotar:
- Issue ID (ej: `RPM-5`)
- Short ID
- Título
- Last seen
- Status

### Step 2: Vercel — deploy y logs

Verificar:
1. **Último deploy**: ¿Cuándo fue? ¿Hubo deploy reciente que pudo romper algo?
   - URL: `https://vercel.com/rpmsysadim-5965s-projects/rpm/deployments`
   - O via Chrome MCP si se necesita detalle visual
2. **Build logs**: ¿Hubo warnings o errores en el build?
3. **Runtime logs**: Si el error es de server-side, revisar logs de la función afectada

Cruzar el timestamp del error de Sentry con el último deploy:
- Si el error empezó después de un deploy → probable regresión
- Si el error existía antes → bug preexistente

### Step 3: Neon — verificación de datos

Solo si el incidente puede estar relacionado con datos:
- "No veo tal producto/cliente/OT"
- "Los precios están mal"
- "El stock no coincide"

```bash
# Conexión a DB local o Neon según .env.local
# Usar queries específicas, NO explorar toda la BD
```

Ejemplos:
- Producto desaparecido: `SELECT id, name, active FROM products WHERE name ILIKE '%<nombre>%'`
- Precio incorrecto: `SELECT * FROM price_list_items WHERE product_id = '<id>'`
- OT no aparece: `SELECT id, status, created_at FROM work_orders WHERE customer_id = '<id>' ORDER BY created_at DESC LIMIT 5`

### Step 4: Git — cambios recientes

```bash
git log --oneline -20
git log --since="2 days ago" --oneline
```

Si el error empezó después de un deploy, identificar el commit:
- `git log --oneline <deploy-sha>~1..<deploy-sha>`
- Revisar el diff: `git diff <sha-anterior>..<deploy-sha> -- <directorio-relacionado>`

### Step 5: Síntesis

Antes de proponer cualquier fix, presentar al usuario:

```
## Diagnóstico

**Reporte del cliente:** <descripción>

**Sentry:** Issue RPM-X "<título>" — last seen <fecha> — <status>
**Vercel:** Último deploy <sha> hace <tiempo> — <Ready/Error>
**Neon:** <resultado de query relevante, si aplica>
**Git:** Último cambio relevante: <sha> "<mensaje>"

**Hipótesis:** <qué creemos que pasó>
**Evidencia:** <qué datos respaldan la hipótesis>
**Acción propuesta:** <qué hacer al respecto>
```

## Reglas

- **NUNCA proponer un fix sin haber completado al menos Step 1 y 2**
- Si Sentry no tiene errores → el problema puede ser de UI, de datos, o no reproducible
- Si Vercel tiene un deploy fallido → priorizar arreglar el deploy antes que el bug
- Si el issue está en Sentry pero resuelto → preguntar al cliente si sigue pasando
- Si se necesita acceso a la DB, usar queries de solo lectura primero
- Si el incidente es crítico (app caída, datos perdidos), escalar inmediatamente sin esperar al flujo completo

## Herramientas disponibles

| Herramienta | Comando | Para qué |
|---|---|---|
| Sentry CLI | `pnpm sentry:issues` | Ver errores capturados |
| Sentry CLI | `pnpm sentry:releases` | Ver releases y source maps |
| Vercel | Chrome MCP a deployments page | Estado de deploys |
| Neon | `psql` o Neon MCP | Queries a la BD |
| Git | `git log`, `git diff` | Cambios recientes |
| Chrome MCP | Navegar a la URL afectada | Reproducir el error visualmente |
