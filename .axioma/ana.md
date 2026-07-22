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
    - [ ] Desglose impositivo detallado (por item, requiere migración)
- [x] Generación de PDFs de pre-facturas con leyenda obligatoria (vía Print).
- [x] Configuración fiscal en settings (CUIT, Punto de Venta, Certificados).
- [ ] Integración con AFIP (WSFE - Conexión real).

## ✅ DONE
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

## 🧠 LEARNINGS
- **Métricas e Indicadores en el Listado de Comprobantes:** Integrar `CrudStats` con cálculos reactivos basados en `useMemo` del listado de comprobantes (`invoices`) permite a los contadores y administradores tener un resumen visual instantáneo de los totales oficiales facturados (`ISSUED`), los montos que quedan en trámite de pre-facturas (`DRAFT` / `REJECTED`), y de los rechazos de AFIP que necesitan atención, incrementando drásticamente el control operativo del negocio sin tener que recurrir a herramientas externas o exportaciones manuales.
- **Búsqueda por Documento y UI Responsiva de Filtros:** Agregar búsqueda por documento de cliente (`customerDoc`) en el backend de comprobantes habilita a los contadores a filtrar documentos directamente por CUIT/DNI sin conocer el nombre del cliente. Combinar esto con un buscador con tipografía mono (`font-mono`), padding estándar (`pl-10`), y botón de borrado rápido (`X`) reduce la fricción y unifica la experiencia con otras pantallas como órdenes de trabajo.
- **Filtro Temporal y Exportación Contable:** Para robustecer la experiencia administrativa y fiscal, no basta con listar comprobantes. Proveer controles intuitivos de filtrado temporal por rango de fechas ("Desde" y "Hasta") junto con la exportación estructurada a formato CSV (respetando la firma UTF-8 BOM `\ufeff`) permite a los contadores y administradores conciliar períodos contables (meses, trimestres o días) sin fricciones. Integrar la opción de exportar el listado actual filtrado en las pantallas de administración de alto volumen de datos permite descargas rápidos y seguras.
- **Resolución de Colisiones en Secuencias:** El campo `number` de la tabla `invoice` tiene un índice único global. Por lo tanto, cuando pre-facturas de diferentes tipos (ej: `X_A` and `X_B`) comparten el mismo prefijo `X-0001` pero usan secuencias independientes por tipo, el sistema genera números de comprobantes duplicados (como `X-0001-00000001`), rompiendo la base de datos con violaciones de clave única. Al unificar la asignación secuencial de todas las pre-facturas bajo la misma consulta de prefijo, se garantiza la total unicidad de números y se corrigen colisiones en entornos de producción y pruebas concurrentes.
- **Edición de Datos de Facturación:** Para dar flexibilidad al usuario ante errores de tipeo o cambio de datos del cliente, habilitar la edición de `customerName`, `customerDoc` y `customerDocType` en comprobantes no emitidos (`DRAFT` / `REJECTED`) evita tener que cancelar y refacturar toda la operación. Si cambian el tipo de documento (ej: de DNI a CUIT), el sistema debe recalcular el tipo de factura de forma transaccional (`X_B` a `X_A` o viceversa), re-asignar el número secuencial correspondiente a la nueva serie, y actualizar el desglose impositivo.
- **Desglose impositivo:** Para comprobantes tipo B (consumidor final), aunque el total sea lo que ve el cliente, el sistema debe registrar el neto y el IVA por separado para futuros reportes fiscales (Libro IVA Digital). Se implementó un cálculo automático del 21% para pre-facturas.
- **Esquema:** Se verificó que `work_order.invoiceId` ya existe en el esquema de Prisma, permitiendo la vinculación directa sin migraciones adicionales en este paso.
- **Configuración Tipada:** Al manejar booleanos en `settingsService`, es crítico asegurar la conversión de tipos in la API, ya que los valores de base de datos pueden recuperarse como strings (ej: "true") que fallan comparaciones estrictas con literales booleanos.
- **Componentes Custom:** Se optó por una implementación local del componente `Switch` para evitar conflictos de importación interna con Radix-UI detectados durante la revisión de código.
- **Virtualización de Items:** Dado que el modelo `invoice` no guarda items propios (para evitar redundancia con las ventas originales), se implementó una estrategia de fetch dinámico en `getInvoiceById` que une los items de la referencia (`work_order`, `direct_sale`, etc.). Esto simplifica la integridad referencial.
- **Layout de Impresión:** El uso de Tailwind `print:` classes permite mantener una sola página para detalle y PDF, agilizando el desarrollo sin requerir librerías pesadas de generación de PDF en el servidor para las fases iniciales.
- **Sincronización de Selección en DataTable:** Para evitar bucles de renderizado infinitos al sincronizar la selección de filas con un componente padre, es vital omitir la instancia `table` de las dependencias del `useEffect` in `DataTable`, ya que `useReactTable` la recrea en cada render.
- **Numeración AFIP por Tipo:** La numeración oficial debe ser única por Punto de Venta y por Tipo de Comprobante. Se ajustó el servicio para filtrar correctamente por el tipo de comprobante AFIP al buscar el último número autorizado en la base de datos local.
- **Persistencia de Errores Fiscales:** Al integrar con AFIP, no basta con mostrar el error en el momento. Persistir el estado `REJECTED` con sus observaciones permite un flujo de trabajo asíncrono y robusto, donde el usuario puede corregir datos y reintentar sin perder el rastro del error original.
- **Workflow Integrado:** Permitir la oficialización directamente desde la entidad de origen (Venta/OT) reduce drásticamente la fricción, evitando que el usuario tenga que saltar entre módulos para finalizar el proceso fiscal.
- **Diferenciación de Visualización Fiscal:** Los comprobantes tipo B (Consumidor Final) requieren una presentación simplificada donde el IVA no se desglosa visualmente pero se mantiene el total con la leyenda "IVA Incluido", a diferencia del tipo A donde el desglose es obligatorio.
- **Validación Preventiva de Datos Fiscales:** Implementar la validación de CUIT (módulo 11) tanto en el frontend como en la API de oficialización previene errores costosos de rechazo de AFIP y mejora la calidad de los datos del sistema.
- **Micro-UX en Configuración:** Agregar un botón de "Probar Conexión" en la sección fiscal permite al usuario verificar sus credenciales y el estado del servicio sin necesidad de intentar emitir un comprobante real, reduciendo la ansiedad y la fricción en la puesta en marcha.
- **Cobertura de Pruebas Automatizadas de Facturación:** Para garantizar la estabilidad del motor de facturación fiscal y evitar regresiones al oficializar comprobantes, es crítico que el servicio de facturación cuente con pruebas integradas y continuas. Se trasladaron las pruebas del servicio de facturas a `tests/unit/invoiceService.test.ts` para que se ejecuten automáticamente con `pnpm test`. Se añadieron pruebas robustas de secuenciación de comprobantes, determinación de tipos de factura según datos de facturación e impuestos (IVA 21%), que operan de forma relativa y robusta para ser totalmente independientes del estado previo de la base de datos de pruebas o de las semillas del sistema.

---

## 🛠️ PROPUESTA DE CAMBIO DE SCHEMA
Para un desglose preciso de IVA por item, se propone agregar `taxRate` a los items de venta:

```typescript
// En work_order_item, direct_sale_item, credit_note_item
// db/schema/schema.ts
export const workOrderItem = pgTable('work_order_item', {
  // ...
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('21.00').notNull(), // Alicuota de IVA (21, 10.5, 0)
});
```

**Justificación:** Actualmente el sistema asume 21% de forma global para pre-facturas. AFIP requiere el desglose por alicuota real en el comprobante oficial. Tenerlo por item permite ventas mixtas y mayor precisión.
