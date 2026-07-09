# AGENTS.md - Services Domain

## Domain Overview

Catálogo de servicios de instalación con costos base, tiempos estimados y factores por tipo de vehículo. Define el trabajo estándar que se realiza en órdenes de trabajo.

## Related Specifications

- **@[specs/business-domain.md]** - Entidad Servicio en modelo de negocio y flujo de instalación
- **@[specs/checklist-crud-implementation.md]** - Estándares CRUD para entidades importantes
- **@[specs/spec-price-lists.md]** - Soporte para excepciones de servicios en listas de precios

## Key Components

- `page.tsx` - CRUD principal con `CrudAdmin` y stats cards
- `ServiceDialog` - Modal creación/edición
- `ServiceForm` - Formulario con costo, tiempo y factor vehículo

## Architecture

- **Tipo**: Entidad importante (con stats cards según checklist)
- **Campos**: nombre, descripción, costo base, tiempo (minutos), factor vehículo
- **Relaciones**: WorkOrders (servicios utilizados)
- **Precios**: Dinámicos desde listas con posibles excepciones
- **Factores**: Multiplicador de costo/tiempo según tipo de vehículo

## Development Notes

- Usa `CrudAdmin` con stats cards (servicios, activos, tiempo promedio, costo promedio)
- Costo base como referencia para cálculos dinámicos de precios
- Tiempo estimado para planificación de trabajos
- Factor vehículo ajusta costo/dificultad por tipo (auto, SUV, camioneta)
- Integración con listas de precios para excepciones específicas
- Utilizado en órdenes de trabajo para definir trabajos a realizar

## Timezone Handling (Lección Aprendida)

**Contexto:** El servidor de producción puede estar en UTC-0 mientras que desarrollo está en UTC-3 (Argentina). Todo el manejo de fechas debe ser timezone-safe.

### Reglas

- **NUNCA** usar `new Date(year, month, day)` o `date.getHours()`/`date.getDate()` para lógica de negocio — dependen de la timezone del servidor
- **SIEMPRE** usar `Intl.DateTimeFormat` con `timeZone: 'America/Argentina/Buenos_Aires'` para extraer componentes de fecha (año, mes, día, hora) cuando la lógica de negocio es Argentina
- **SIEMPRE** usar las utilidades de `@/lib/utils/date.ts` (`getArgentinaStartOfDay`, `getArgentinaEndOfDay`, `parseArgentinaDateString`) para calcular rangos de fechas
- **Argentina es UTC-3 fijo** (sin DST), por lo que `getArgentinaStartOfDay` siempre retorna `YYYY-MM-DDT03:00:00Z` — esto hace seguro iterar con `setDate(+1)` sobre fechas UTC
- **Para inicializar buckets mensuales**, generar claves `YYYY-MM` como strings usando `Intl.DateTimeFormat` en lugar de crear objetos `Date` con `new Date(year, month, 1)` que se desplazan por timezone
- **Frontend**: `new Date()` y `.setHours()` operan en la timezone del navegador del usuario (Argentina), y `.toISOString()` convierte a UTC antes de enviar a la API — esto es correcto
- **API routes**: Reciben ISO strings UTC, los pasan por `getArgentinaStartOfDay/EndOfDay` para obtener rangos correctos
- **Prisma queries**: Usar `gte`/`lte` con Date objects UTC obtenidos de las utilidades de timezone
