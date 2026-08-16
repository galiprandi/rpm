# Architecture Decision Records (ADR)

## ADR-001: Manejo de fechas en zona horaria de Argentina con servidor UTC

**Status:** Accepted
**Date:** 2026-05-29
**Contexto:** El negocio opera en Argentina (GMT-3) pero el servidor de producción ejecuta en UTC. Los componentes de UI envían fechas como strings `YYYY-MM-DD` (input type="date"), que al ser interpretadas por `new Date()` en el backend resultaban en fechas desfasadas por 3 horas, causando que las operaciones del día no aparezcan correctamente.

**Decisión:**
1. El frontend es responsable de convertir fechas de negocio (Argentina) a UTC antes de enviar al backend.
2. Se utiliza `dayjs` con plugins `utc` y `timezone` en el frontend.
3. Las fechas se envían como ISO 8601 UTC completas (ej: `2026-05-29T03:00:00.000Z`) para representar el inicio del día en Argentina.
4. El backend recibe el Date UTC y lo usa directamente sin conversión adicional, delegando a `getArgentinaStartOfDay` cuando se requiere el rango del día.

**Consecuencias:**
- El backend es agnóstico de la zona horaria del cliente.
- No se requieren hacks como `parseArgentinaDateString` en endpoints.
- Si el negocio se muda a otra zona horaria, solo se actualiza el timezone en el frontend.

**Implementado en:**
- `components/dashboard/DailyOperations.tsx` — envía fecha UTC vía dayjs
- `app/api/dashboard/operations/route.ts` — recibe Date UTC directamente
- `app/api/cash-movements/summary/route.ts` — recibe Date UTC directamente

## ADR-002: Certificados AFIP cifrados en DB en lugar de filesystem

**Status:** Accepted
**Date:** 2026-08-15
**Contexto:** La integración AFIP requiere un certificado `.p12` para autenticarse contra los Web Services (wsfe). El sistema se despliega en Vercel serverless, donde el filesystem es efímero y read-only. No es posible mantener un archivo `.p12` persistente en disco. La implementación anterior guardaba una ruta de archivo (`AFIP_CERT_PATH`) en settings, lo cual no funciona en producción.

**Decisión:**
1. El certificado `.p12` se guarda **cifrado con AES-256-GCM** en la tabla `setting` (key-value), no en filesystem.
2. La master key de cifrado vive en env var `AFIP_CERT_MASTER_KEY` (32 bytes en base64), nunca en DB.
3. El password del certificado también se guarda cifrado con la misma master key.
4. La UI de `/adm/settings` permite subir/reemplazar/eliminar el certificado sin tocar terminal ni env vars (excepto la master key, que es responsabilidad del administrador).
5. Si la master key no está configurada, el sistema opera en modo mock automáticamente (strategy pattern).

**Alternativas descartadas:**
- **Filesystem path**: descartado por Vercel (efímero, read-only).
- **Env var con contenido base64**: funciona pero rotación de certificado requiere redeploy. Con DB, se rota desde la UI sin redeploy.
- **Plaintext en DB**: descartado por seguridad (backups de Neon expone el certificado).

**Consecuencias:**
- Un dump de la base de datos no expone el certificado sin la master key.
- La rotación del certificado (cada 2 años) se hace desde la UI sin redeploy.
- Si se pierde la master key, los certificados cifrados quedan inaccesibles (requiere re-subir el certificado).
- El sistema funciona sin certificado configurado (modo mock), lo que permite desarrollo y testing sin credenciales reales.

**Implementado en:**
- `lib/services/certService.ts` — cifrado/descifrado AES-256-GCM
- `app/api/afip/certificate/route.ts` — endpoints upload/delete/get
- `app/adm/settings/SettingsClient.tsx` — UI de subida
- `lib/services/afip/index.ts` — factory que selecciona mock vs real

## ADR-003: Flujo PENDING con reconciliación para oficialización AFIP

**Status:** Accepted
**Date:** 2026-08-15
**Contexto:** La oficialización de comprobantes ante AFIP es una llamada síncrona que puede exceder el timeout de Vercel (10s Hobby, 60s Pro). Si AFIP responde después del corte, el CAE se pierde: la factura queda en DRAFT pero AFIP la tiene emitida. Al reintentar, se pide otro número y se genera un comprobante huérfano en AFIP. Además, el doble-click del usuario puede generar dos requests simultáneos que ambos vean DRAFT y llamen a AFIP.

**Decisión:**
1. El endpoint `officialize` setea `PENDING` **antes** de llamar a AFIP (commit inmediato en DB).
2. Solo comprobantes en `DRAFT` o `REJECTED` pueden ser oficializados. `PENDING` es rechazado con HTTP 409.
3. Si el request se interrumpe, el comprobante queda en `PENDING`.
4. Un endpoint `/api/invoices/[id]/reconcile` consulta AFIP (`FECompConsultar`) para verificar si el comprobante fue emitido:
   - Si AFIP lo tiene → hidrata CAE + pasa a `ISSUED`.
   - Si AFIP no lo tiene → revierte a `DRAFT` (safe to retry).
5. Cada interacción con AFIP se persiste en tabla `afip_log` para auditoría.

**Consecuencias:**
- Double-submit eliminado: el segundo request ve `PENDING` y es rechazado.
- Timeouts recuperables: el usuario puede reconciliar manualmente.
- No se generan comprobantes huérfanos en AFIP.
- El estado `PENDING` ya existía en el schema pero no se usaba; ahora tiene un propósito real.

**Implementado en:**
- `app/api/invoices/[id]/officialize/route.ts` — flujo PENDING + logging
- `app/api/invoices/[id]/reconcile/route.ts` — reconciliación
- `lib/services/afipLogService.ts` — log de interacciones
- `app/adm/invoices/page.tsx` — botón Reconciliar en listado
- `app/adm/invoices/[id]/page.tsx` — banner PENDING + botón Reconciliar

## ADR-004: Degradación controlada con health check de certificados AFIP

**Status:** Accepted
**Date:** 2026-08-15
**Contexto:** El factory original (`getAfipService()`) usaba `isCertConfigured()` que solo verificaba la presencia de `AFIP_CERT_MASTER_KEY` en env vars. Esto causaba tres problemas:
1. Si la master key existía pero no había certificado en DB, el factory seleccionaba `RealAfipService`, que al intentar descifrar un cert inexistente lanzaba un error no controlado.
2. No había detección de vencimiento. AFIP rechaza certificados expirados con errores crípticos. El sistema iba a real, AFIP rechazaba, y el comprobante quedaba en `REJECTED` sin explicación clara.
3. Si la master key se rotaba o el dato se corrompía, el descifrado fallaba en runtime sin recovery.

**Decisión:**
1. Reemplazar `isCertConfigured()` (booleano simple) por `getCertHealth()` que devuelve un estado granular: `ready`, `missing`, `no-master-key`, `expired`, `invalid`.
2. El factory solo selecciona `RealAfipService` si `state === 'ready'`. Cualquier otro estado → `MockAfipService`.
3. Al subir un certificado, se parsea con `node-forge` (pure JS, sin openssl CLI) para extraer `notAfter` y guardarlo en `AFIP_CERT_EXPIRES_AT`.
4. El health check intenta descifrar el cert en cada evaluación (cheap — env var + DB read + AES decrypt). Si falla, retorna `invalid`.
5. La UI muestra los 5 estados con colores semánticos y acciones específicas (renovar, reemplazar, eliminar).
6. `RealAfipService` lanza `AfipCertError` (error tipado) si AFIP rechaza por cert en runtime, permitiendo que el caller degrade a mock si es necesario.

**Consecuencias:**
- El sistema nunca crashea por cert faltante, vencido, o corrupto — siempre degrada a mock.
- El administrador ve claramente qué problema tiene el certificado y qué acción tomar.
- El countdown de 30 días antes del vencimiento permite renovación proactiva.
- `node-forge` agrega ~200KB al bundle, pero solo se carga al subir un certificado (dynamic require).
- El health check hace una DB read + AES decrypt por request, pero el factory cachea la instancia por estado para minimizar overhead.

**Implementado en:**
- `lib/services/certService.ts` — `getCertHealth()`, `extractExpiry()` con node-forge
- `lib/services/afip/index.ts` — factory con degradación por health state
- `lib/services/afip/real.ts` — `AfipCertError`, `AfipNotWiredError`
- `app/api/afip/certificate/route.ts` — GET devuelve health granular
- `app/adm/settings/SettingsClient.tsx` — UI con 5 estados + countdown
