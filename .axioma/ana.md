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

## 🧠 LEARNINGS
- **Desglose impositivo:** Para comprobantes tipo B (consumidor final), aunque el total sea lo que ve el cliente, el sistema debe registrar el neto y el IVA por separado para futuros reportes fiscales (Libro IVA Digital). Se implementó un cálculo automático del 21% para pre-facturas.
- **Esquema:** Se verificó que `work_order.invoiceId` ya existe en el esquema de Prisma, permitiendo la vinculación directa sin migraciones adicionales en este paso.
- **Configuración Tipada:** Al manejar booleanos en `settingsService`, es crítico asegurar la conversión de tipos en la API, ya que los valores de base de datos pueden recuperarse como strings (ej: "true") que fallan comparaciones estrictas con literales booleanos.
- **Componentes Custom:** Se optó por una implementación local del componente `Switch` para evitar conflictos de importación interna con Radix-UI detectados durante la revisión de código.
- **Virtualización de Items:** Dado que el modelo `invoice` no guarda items propios (para evitar redundancia con las ventas originales), se implementó una estrategia de fetch dinámico en `getInvoiceById` que une los items de la referencia (`work_order`, `direct_sale`, etc.). Esto simplifica la integridad referencial.
- **Layout de Impresión:** El uso de Tailwind `print:` classes permite mantener una sola página para detalle y PDF, agilizando el desarrollo sin requerir librerías pesadas de generación de PDF en el servidor para las fases iniciales.
- **Sincronización de Selección en DataTable:** Para evitar bucles de renderizado infinitos al sincronizar la selección de filas con un componente padre, es vital omitir la instancia `table` de las dependencias del `useEffect` en `DataTable`, ya que `useReactTable` la recrea en cada render.
- **Numeración AFIP por Tipo:** La numeración oficial debe ser única por Punto de Venta y por Tipo de Comprobante. Se ajustó el servicio para filtrar correctamente por el tipo de comprobante AFIP al buscar el último número autorizado en la base de datos local.

---

## 🛠️ PROPUESTA DE CAMBIO DE SCHEMA
Para un desglose preciso de IVA por item, se propone agregar `taxRate` a los items de venta:

```prisma
// En work_order_item, direct_sale_item, credit_note_item
model ..._item {
  // ...
  taxRate Decimal @db.Decimal(5, 2) @default(21.00) // Alicuota de IVA (21, 10.5, 0)
}
```

**Justificación:** Actualmente el sistema asume 21% de forma global para pre-facturas. AFIP requiere el desglose por alicuota real en el comprobante oficial. Tenerlo por item permite ventas mixtas y mayor precisión.
