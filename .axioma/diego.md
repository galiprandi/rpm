# 📓 Journal — Diego 📊

## 📋 BACKLOG
- [ ] Implementación de reportes adicionales (ej: Reporte de Servicios específicos)
- [ ] Dashboards comparativos multi-periodo avanzados

## ✅ DONE
- [x] 2025-07-11 — Mejora de Reporte de Ventas: Agregado de Top Productos, Distribución por Categoría y Exportación CSV. Refactor de servicio a `salesReportService.ts`. (PR #diego/reports/sales-report-enhancements)
- [x] 2025-07-10 — Implementación de reporte de Compras (abastecimiento, proveedores y evolución de costos) (PR #diego/reports/purchase-report)
- [x] 2025-07-05 — Implementación de reporte de Stock (valorización, alertas de reposición y distribución por categoría) (PR #diego/reports/stock-report)
- [x] 2025-07-06 — Implementación de reporte de Taller & Operación (performance, estados y tiempos) (PR #diego/reports/workshop-report)
- [x] 2025-07-08 — Implementación de reporte de Finanzas & Flujo (ingresos, egresos y medios de pago) (PR #diego/reports/finance-report)
- [x] 2025-07-09 — Implementación de reporte de Clientes (adquisición, recurrencia y ranking) (PR #diego/reports/customer-report)

## 🧠 LEARNINGS
## 2025-07-05 - Reporte de Stock y Valorización
**Learning:** El componente `MetricCard` utiliza la propiedad `subtitle` en lugar de `description` para el texto secundario. Es importante verificar las interfaces de componentes compartidos antes de usarlos para evitar errores de tipo en el build.
**Action:** Consultar siempre la definición del componente en `components/dashboard/MetricCard.tsx`.

## 2025-07-05 - Performance en Reportes
**Learning:** El cálculo de valorización de inventario puede ser pesado si el catálogo es extenso. La implementación de caching en el API Route (`revalidate` y `Cache-Control`) es fundamental para mantener la respuesta rápida del sistema.
**Action:** Mantener el patrón de caching en futuros reportes (Ventas, Taller, etc).
- [x] 2025-07-08 — Implementación de reporte de Finanzas & Flujo (ingresos, egresos, flujo neto y distribución por medio de pago) (PR #diego/reports/finance-report)
