# 📓 Journal — Diego 📊

## 📋 BACKLOG

## ✅ DONE
- [x] 2026-07-23 — Refactorización de Renderizados en Cascada y Estados de Carga en Clientes de Reportes: Reemplazadas las inicializaciones de fechas personalizadas en los 8 clientes de reportes con inicializadores perezosos de estado (`lazy state initializers`) de React (`useState(() => ...)`), eliminando los efectos post-montaje redundantes. Reubicada la transición de estado `loading=true` a los controladores de eventos de cambios de filtro e inputs de fecha personalizados para eliminar advertencias `react-hooks/set-state-in-effect`, mejorar el rendimiento de montaje y asegurar transiciones de estado predecibles. (PR #diego/reports/react-hooks-cascading-renders-fix)
- [x] 2026-07-22 — Estandarización de Accesibilidad y Contraste WCAG AA en Clientes de Reportes: Removido el TooltipProvider local redundante en el reporte de Stock y normalizado el uso de clases de contraste de texto financiero semántico (pasando de `text-emerald-600`/`text-red-600` a las variantes accesibles `text-emerald-700`/`text-red-700`) en los reportes de Taller, Finanzas, Servicios y Rentabilidad. Agregado de atributos `aria-hidden="true"` y `pointer-events-none` en todos los iconos Lucide decorativos de los reportes. (PR #diego/reports/accessibility-contrast-polishing)
- [x] 2026-07-21 — Implementación de Filtro por Rango de Fechas Personalizado en Reportes: Diseñado e implementado el soporte para selección de períodos personalizados ("custom") en el Centro de Reportes y en todos los reportes analíticos basados en el tiempo (Ventas, Compras, Rentabilidad, Finanzas, Taller, Clientes y Servicios). Añadidos inputs de fecha inline ("Desde" y "Hasta") que por defecto se inicializan con un rango de 30 días, y cálculo dinámico de período de comparación matemáticamente equivalente e inmediatamente anterior para análisis comparativos fidedignos. (PR #diego/reports/custom-date-range-filter)
- [x] 2026-07-20 — Estandarización de Exportación a CSV en Reportes de Ventas, Servicios y Clientes: Refactorización completa del comportamiento de exportación a CSV en SalesReportClient, ServicesReportClient y CustomersReportClient para asegurar el uso del BOM UTF-8 (`\ufeff`) y del objeto Blob, evitando rotura de estructura de columnas en Excel ante caracteres con tildes, diacríticos o comas internas. (PR #diego/reports/standardize-csv-exports)
- [x] 2026-07-19 — Exportación de Reporte de Stock y Unit Tests de Inventario: Diseñada e implementada la exportación de reporte de stock a CSV en StockReportClient.tsx con UTF-8 BOM, incluyendo múltiples secciones de análisis y alertas. Creada suite de pruebas unitarias completas en tests/unit/stockReportService.test.ts. (PR #diego/reports/stock-csv-export-testing)
- [x] 2026-07-18 — Estandarización de Tablas de Reportes a Componentes shadcn/ui: Refactorización completa de todos los módulos de reportes que usaban tablas HTML nativas (Ventas, Clientes, Servicios, Compras, Rentabilidad y Finanzas) para implementar los componentes de tabla unificados de `@/components/ui/table`. (PR #diego/reports/standardize-report-tables)
- [x] 2026-07-17 — Exportación Completa de Reportes a CSV (Parity): Diseñada e implementada la exportación a CSV para todos los módulos de reportes restantes (Compras, Finanzas, Rentabilidad, Taller y Deudores). Incorporado soporte UTF-8 BOM (`\ufeff`) para garantizar la correcta visualización de caracteres con tildes y diacríticos en Microsoft Excel. (PR #diego/reports/csv-export-parity)
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
## 2026-07-23 - Eliminación de Renderizados en Cascada e Inicializaciones en Efectos
**Learning:** En React, inicializar estados de filtros en un hook `useEffect` síncrono tras el primer render provoca una doble pasada de renderizado ("cascading renders") que degrada el rendimiento. Al utilizar `lazy state initializers` (`useState(() => ...)`) para inicializar fechas u otros valores dinámicos, el componente se monta con su estado final correcto desde el primer instante. Además, el estado de carga (`loading`) debe ser gestionado a través de transiciones asíncronas o en los controladores de eventos del usuario en lugar de forzarse síncronamente dentro de efectos, eliminando las advertencias de `set-state-in-effect`.
**Action:** Usar siempre inicializadores perezosos de estado para cualquier estado que deba pre-calcularse al montar y evitar llamadas síncronas de `setState` dentro de `useEffect`.

## 2026-07-22 - Estandarización de Accesibilidad y Contraste WCAG AA en Clientes de Reportes
**Learning:** El uso de iconos Lucide decorativos sin el atributo `aria-hidden="true"` expone a los usuarios de tecnologías asistivas (lectores de pantalla) a ruido auditivo redundante al navegar por dashboards densos. Asimismo, textos con tonos verdes o rojos claros como `emerald-600` o `red-600` dificultan la lectura por debajo de los ratios de contraste recomendados de 4.5:1. Al elevarlos a clases de nivel `700` (`text-emerald-700` / `text-red-700`), se garantiza la plena legibilidad y conformidad con el estándar WCAG AA de accesibilidad visual.
**Action:** Aplicar siempre el estándar de contraste de 700 para textos y estados financieros semánticos y ocultar sistemáticamente los iconos decorativos para no perturbar la navegación accesible.

## 2026-07-21 - Filtro Temporal Personalizado en Business Intelligence
**Learning:** Ofrecer únicamente filtros de rango predefinidos (como 'últimos 30 días' o 'este mes') limita la capacidad analítica de los tomadores de decisiones que necesitan auditar fechas arbitrarias o períodos específicos. Al habilitar selección personalizada de fechas ('custom'), es esensial acompañarla de una lógica automática de comparación de períodos que mantenga una ventana de igual duración inmediatamente anterior para conservar la validez matemática de los porcentajes de cambio (MoM, WoW, etc.).
**Action:** Al implementar filtros de fecha dinámicos, autocalcular siempre la ventana de comparación anterior con la misma cantidad de milisegundos y desfasada exactamente por la duración seleccionada.

## 2026-07-20 - Consistencia en Exportación a CSV
**Learning:** En un sistema de reportes multi-módulo, la consistencia en utilidades secundarias (como la exportación a CSV) es tan crítica como los KPIs visuales principales. Utilizar primitivas legacy (`data:text/csv`) sin BOM UTF-8 o sin escape de caracteres en algunos módulos mientras que otros usan Blobs estructurados genera una experiencia inconsistente para el usuario final al abrir sus datos en Excel.
**Action:** Unificar y estandarizar siempre las rutinas de descarga de archivos exportados usando el mismo estándar robusto de codificación y formateo en todas las pantallas.

## 2026-07-19 - Exportación Estructurada Multi-Sección en CSV
**Learning:** Cuando un reporte analítico (como el de Stock & Inventario) se compone de múltiples colecciones o tablas independientes en lugar de una única tabla plana, exportar un CSV estructurado con secciones de datos tituladas y líneas en blanco intermedias resulta infinitamente más útil para el usuario que un CSV plano o exportaciones parciales desarticuladas.
**Action:** Utilizar el formato multi-sección con cabeceras de sección separadas para exportar reportes analíticos complejos a un único archivo CSV.

## 2026-07-18 - Estandarización de Tablas de Reportes a Componentes shadcn/ui
**Learning:** Reemplazar las tablas nativas de HTML (`<table>`, `<thead>`, `<tbody>`, etc.) con los componentes estándar de shadcn/ui (`Table`, `TableHeader`, `TableBody`, etc.) no solo unifica visualmente los reportes bajo el mismo lenguaje de diseño, sino que también hereda automáticamente comportamientos responsivos, clases de accesibilidad y estados hover consistentes sin necesidad de redefinirlos localmente.
**Action:** Utilizar siempre las abstracciones de tabla del proyecto (`@/components/ui/table`) en lugar de etiquetas HTML nativas para cualquier vista administrativa o modular nueva.

## 2026-07-17 - UTF-8 BOM para Excel en Exportación CSV
**Learning:** Al generar archivos CSV en el cliente usando Blobs, Excel por defecto puede fallar al decodificar caracteres UTF-8 en español (como tildes o caracteres especiales en "Teléfono", "Antigüedad", etc.). Prependiendo el Byte Order Mark (BOM) de UTF-8 (`\ufeff`) al inicio del contenido del CSV, Excel detecta automáticamente la codificación y renderiza todo correctamente.
**Action:** Usar siempre `"\ufeff" + [headers.join(","), ...rows.join("\n")].join("\n")` al exportar archivos CSV con soporte de idioma español.

## 2026-07-16 - Vitest Test File Exclusions
**Learning:** El archivo `vitest.config.ts` tiene un patrón de exclusión explícito para archivos en `lib/services/*Service.test.ts`. Por esta razón, cualquier nuevo test de servicio debe colocarse en `tests/unit/` (por ejemplo, `tests/unit/overviewReportService.test.ts`) para que el framework de tests lo detecte y ejecute de forma automática.
**Action:** Colocar siempre los tests de servicios y utilidades del backend en la carpeta `tests/unit/`.

## 2025-07-05 - Reporte de Stock y Valorización
**Learning:** El componente `MetricCard` utiliza la propiedad `subtitle` en lugar de `description` para el texto secundario. Es importante verificar las interfaces de componentes compartidos antes de usarlos para evitar errores de tipo en el build.
**Action:** Consultar siempre la definición del componente en `components/dashboard/MetricCard.tsx`.

## 2025-07-05 - Performance en Reportes
**Learning:** El cálculo de valorización de inventario puede ser pesado si el catálogo es extenso. La implementación de caching en el API Route (`revalidate` y `Cache-Control`) is fundamental para mantener la respuesta rápida del sistema.
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
