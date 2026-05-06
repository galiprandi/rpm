# Informe de Alineación: Specs vs Codebase

Este informe resume el análisis de consistencia entre el sistema de especificaciones recientemente reorganizado y la implementación real en el codebase de RPM.

## 1. Análisis de Alineación (Brechas Detectadas)

Se han identificado discrepancias significativas entre lo documentado originalmente y la realidad técnica del proyecto:

### 🚀 AFIP e Invocing
- **Documentado**: Sistema 100% integrado con `afip.js`.
- **Realidad**: La infraestructura de datos está lista (`afipData` en `invoice`), pero la librería `afip.js` no está instalada y el servicio de integración (`afipService.ts`) no existe. Se ajustó la spec a `🟡 Parcialmente implementado`.

### 🤖 Bot GER (IA)
- **Documentado**: Sistema multi-agente con Vercel AI SDK funcionando.
- **Realidad**: No se encontró la dependencia `ai` en `package.json`. Las rutas en `app/api/bot` son mayormente placeholders. Se ajustó la spec a `🔴 No iniciado`.

### 🏗️ Patrón de Servicios
- **Documentado**: Toda la lógica reside en `lib/services/*`.
- **Realidad**: Módulos críticos como **Work Orders** y **Customers** tienen su lógica de negocio (creación de registros, validaciones complejas) embebida directamente en las rutas de la API (`app/api/work-orders/route.ts`). Se actualizó la arquitectura para reflejar este estado híbrido.

### 📦 Gestión de Imágenes
- **Documentado**: Soporte para S3/Cloudflare R2.
- **Realidad**: Se utiliza un servicio custom `githubCdnService.ts` para la gestión de activos. Se ajustó la spec de productos.

---

## 2. Oportunidades de Mejora Técnica

### 🛠️ Refactorización a Servicios (Alta Prioridad)
Mover la lógica de `app/api/work-orders` y `app/api/customers` a archivos dedicados en `lib/services/`. Esto permitirá:
1. **Testabilidad**: Facilitar tests unitarios con Vitest.
2. **Reutilización**: Permitir que el futuro Bot de IA use las mismas funciones que la UI.
3. **Mantenibilidad**: Reducir el tamaño de las rutas API.

### 🧪 Fortalecimiento de Transacciones
Asegurar que todas las operaciones multi-tabla (como el alta de una OT que modifica el balance del cliente) estén envueltas en un `prisma.$transaction`. Actualmente, algunas operaciones se realizan de forma secuencial pero no atómica.

---

## 3. Posibles Bugs / Inconsistencias

- **Race Condition en Numeración**: `getNextInvoiceNumber` en `invoiceService.ts` calcula el próximo número basado en una consulta de lectura. En un entorno de alta concurrencia (poco probable ahora, pero posible), dos facturas podrían obtener el mismo número si se emiten simultáneamente.
- **Validación de Stock**: En `directSaleService.ts`, verificar que el stock se valide *antes* de realizar la transacción y que se maneje el error de "Stock Insuficiente" de forma elegante para el usuario.

---

## 4. Nuevas Features de Implementación Sencilla

1. **Dashboard de Alertas de Stock**: Crear un servicio que agrupe productos por debajo de `minStock` y los presente en un widget del dashboard principal.
2. **Historial de Precios por Producto**: Aprovechar la tabla `cost_update_batch` para mostrar un gráfico de evolución de costos de un producto específico.
3. **Checklist Templates**: Permitir predefinir checklists en `settings` para no tener que definirlos manualmente en cada OT (actualmente son JSON libres).
4. **Exportación a CSV de Clientes Deudores**: Extender el reporte de deudores (`/api/reports/debtors`) para permitir descarga directa desde la UI.

---

## 5. Próximos Pasos Recomendados

1. **Instalación de Dependencias**: Instalar `ai`, `openai`, y `afip.js` para cerrar las brechas de las features documentadas pero no implementadas.
2. **Sprint de Refactor**: Dedicar una sesión a mover la lógica de `work-orders` a `workOrderService.ts`.
3. **Validación de Stories**: Actualizar Storybook para los componentes de Taller, asegurando que reflejen los estados reales (`CONFIRMED`, `WAITING`, etc.).
