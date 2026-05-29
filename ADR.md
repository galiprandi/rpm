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
