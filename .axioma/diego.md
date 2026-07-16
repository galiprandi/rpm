# 📓 Journal — Diego 📊

## 📋 BACKLOG

## ✅ DONE
- [x] 2026-07-16 — Implementación de Dashboard Comparativo de Rendimiento Multi-Período: Diseñado e implementado el widget de comparación visual lado a lado para los 4 KPIs clave en el Centro de Reportes, utilizando barras de progreso relativas y responsive. Añadida cobertura de tests completa. (PR #diego/reports/multi-period-comparison)
- [x] 2026-07-15 — Implementación de Reporte de Rentabilidad: Nuevo módulo detallado con métricas de ganancia bruta, margen por categoría y ranking de productos más rentables. (PR #diego/reports/profitability-report)
- [x] 2026-07-14 — Implementación de Dashboard Analítico de Resumen (Overview): Agregado de KPIs de ingresos, rentabilidad estimada, OTs completadas y nuevos clientes con selector de periodo en la página principal de reportes. (PR #diego/reports/overview-dashboard)
- [x] 2026-07-13 — Mejora de Reporte de Stock: Implementación de métricas de Rotación de Stock e Inventario Inmovilizado (Dead Stock). (PR #diego/reports/stock-rotation-metrics)
- [x] 2026-07-12 — Implementación de Reporte de Servicios: Métricas de ingresos por servicio, distribución por categoría de vehículo y performance de técnicos. (PR #diego/reports/services-report)
- [x] 2025-07-11 — Mejora de Reporte de Ventas: Agregado de Top Productos, Distribución por Categoría y Exportación CSV. Refactor de servicio a `salesReportService.ts`. (PR #diego/reports/sales-report-enhancements)
- [x] 2025-07-10 — Implementación de reporte de Compras (abastecimiento, proveedores y evolución de costos) (PR #diego/reports/purchase-report)
- [x] 2025-07-05 — Implementación de reporte de Stock (valorización, alertas de reposición y distribución por categoría) (PR #diego/reports/stock-report)
- [x] 2025-07-06 — Implementación de reporte de Taller & Operación (performance, estados y tiempos) (PR #diego/reports/workshop-report)
- [x] 2025-07-08 — Implementación de reporte de Finanzas & Flujo (ingresos, egresos y medios de pago) (PR #diego/reports/finance-report)
- [x] 2025-07-09 — Implementación de reporte de Clientes (adquisición, recurrencia y ranking) (PR #diego/reports/customer-report)

## 🧠 LEARNINGS
## 2026-07-16 - Vitest Test File Exclusions
**Learning:** El archivo `vitest.config.ts` tiene un patrón de exclusión explícito para archivos en `lib/services/*Service.test.ts`. Por esta razón, cualquier nuevo test de servicio debe colocarse en `tests/unit/` (por ejemplo, `tests/unit/overviewReportService.test.ts`) para que el framework de tests lo detecte y ejecute de forma automática.
**Action:** Colocar siempre los tests de servicios y utilidades del backend en la carpeta `tests/unit/`.

## 2025-07-05 - Reporte de Stock y Valorización
**Learning:** El componente `MetricCard` utiliza la propiedad `subtitle` en lugar de `description` para el texto secundario. Es importante verificar las interfaces de componentes compartidos antes de usarlos para evitar errores de tipo en el build.
**Action:** Consultar siempre la definición del componente en `components/dashboard/MetricCard.tsx`.

## 2025-07-05 - Performance en Reportes
**Learning:** El cálculo de valorización de inventario puede ser pesado si el catálogo es extenso. La implementación de caching en el API Route (`revalidate` y `Cache-Control`) es fundamental para mantener la respuesta rápida del sistema.
**Action:** Mantener el patrón de caching en futuros reportes (Ventas, Taller, etc).

## 2026-07-12 - Consistencia en Reportes
**Learning:** Al implementar el Reporte de Servicios, se identificó que la agregación debe contemplar tanto `work_order_item` como `direct_sale_item`. Sin embargo, la distribución por categoría de vehículo solo es aplicable a servicios en OTs, mientras que las ventas directas deben agruparse en una categoría sintética ("Venta Directa") para no perder visibilidad del ingreso total.
**Action:** Asegurar que todos los reportes de ingresos sumen ambas fuentes (OTs y Ventas Directas) para ser fidedignos.

## 2026-07-14 - Dashboard Overview Agregado
**Learning:** Para proporcionar una visión holística del negocio, el dashboard de Overview debe centralizar métricas de múltiples módulos (Ventas, Taller, Stock, Clientes). Esto requiere una orquestación eficiente de queries para no penalizar el tiempo de carga de la página principal de reportes.
**Action:** Utilizar `Promise.all` para paralelizar queries y mantener el patrón de caching de 10 minutos en el API route.

## 2026-07-15 - Estimación de Costos (COGS)
**Learning:** Al no contar con un histórico de costos por ítem en el momento de la venta, la rentabilidad se estima utilizando el `costPrice` actual de los productos y el `baseCost` de los servicios. Aunque no es exacto retrospectivamente ante cambios de precios, ofrece una aproximación valiosa de la performance económica actual.
**Action:** Clarificar en la UI que los costos son "estimados" basados en valores vigentes.
