# 📓 Journal — Ana 🧾

## 📋 BACKLOG
- [x] Implementación de Fase 1: Cimientos (Esquema, Servicio, Admin Básico, Auto-generación)
    - [x] Esquema base de `invoice`
    - [x] `invoiceService.ts` base
    - [x] Auto-generación desde Venta Directa
    - [x] Auto-generación desde OT (al pasar a DELIVERED)
    - [x] Auto-generación desde Nota de Crédito
    - [x] Desglose impositivo inicial (IVA 21% auto-calculado)
    - [x] Generación manual de documentos desde Venta Directa y OT.
    - [x] Desglose impositivo detallado (por item, requiere migración)
- [x] Generación de PDFs de pre-facturas con leyenda obligatoria (vía Print).
- [x] Configuración fiscal en settings (CUIT, Punto de Venta, Certificados).
- [ ] Integración con AFIP (WSFE - Conexión real).

## ✅ DONE
- [x] 2026-07-26 — Implementación de cálculo adaptativo de impuestos detallado por ítem (Fase 3: Cálculo de Impuestos) con diferenciación de productos (21%) y servicios (10.5%), y alineación exacta de centavos.
- [x] 2026-07-25 — Implementación de auto-anulación de facturas originales al oficializar Notas de Crédito e integración de Diálogo contextual "Anulación (NC)" en el detalle de comprobante.
- [x] 2025-05-21 — Estructura inicial de comprobantes y enlace con ventas directas.
- [x] 2025-05-22 — Integración de pre-facturas en OTs y Notas de Crédito, y visualización de advertencia fiscal.
- [x] 2025-05-24 — Configuración fiscal (AFIP) en el panel de administración (PR #X).
- [x] 2025-05-26 — Mejora de UI de comprobantes y sistema de impresión profesional para pre-facturas.
- [x] 2025-05-28 — Implementación del proceso de oficialización (mock) ante AFIP, obtención de CAE y numeración oficial.
- [x] 2025-07-10 — Implementación de generación manual de documentos (Presupuestos, Remitos, Pre-Facturas) desde Ventas Directas.
- [x] 2025-07-12 — Oficialización por lote de comprobantes con selección múltiple y robustez en numeración.
- [x] 2025-07-13 — Gestión de rechazos de AFIP, visualización de metadatos CAE y mejoras en la UI de detalle.
- [x] 2025-07-14 — Integración del flujo de oficialización en ventas/OTs y refinamiento de visualización para Factura B.
- [x] 2025-07-15 — Validación robusta de CUIT (algoritmo de dígito verificador) y test de conectividad AFIP en configuración.
- [x] 2026-07-16 — Corrección y edición de datos de facturación en comprobantes DRAFT/REJECTED con cambio automático de tipo y numeración secuencial.
- [x] 2026-07-17 — Resolución de colisión en asignación de números secuenciales para pre-facturas de distinto tipo y validación fiscal CUIT/DNI en tiempo real en la UI de edición.
- [x] 2026-07-19 — Reorganización de las pruebas unitarias del servicio de facturación y expansión con cobertura para tipos, impuestos y asignación secuencial.
- [x] 2026-07-20 — Filtro de rango de fechas y exportación a CSV de comprobantes en el listado de facturación (PR #X).
- [x] 2026-07-21 — Búsqueda por documento (CUIT/DNI), validador preventivo de CUIT y buscador con borrado rápido (PR #X).
- [x] 2026-07-22 — Indicadores estadísticos (Header Stats) en el panel de comprobantes y suite de pruebas para `InvoicesPage`.
- [x] 2026-07-23 — Corrección de filtro de fechas para incluir comprobantes emitidos en el día de la fecha de fin (hasta las 23:59:59.999).
- [x] 2026-07-25 — Implementación de desglose impositivo detallado por ítem (Fase 3: Cálculo de Impuestos) y auto-fetching transaccional de ítems.

## 🧠 LEARNINGS
- **Alineación de impuestos por ítem y escala adaptativa:** En lugar de asumir un IVA plano del 21%, el sistema ahora diferencia productos (21%) y servicios (10.5%) consultando los ítems de origen (Work Orders, Direct Sales, Credit Notes). Mediante escalado proporcional y un ajuste corrector final de 1 centavo, garantizamos que la suma del neto y los impuestos coincida exactamente con el total del comprobante para evitar discrepancias por redondeo.
