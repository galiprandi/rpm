# 📓 Journal — Ana 🧾

## 📋 BACKLOG
- [ ] Implementación de Fase 1: Cimientos (Esquema, Servicio, Admin Básico, Auto-generación)
    - [x] Esquema base de `invoice`
    - [x] `invoiceService.ts` base
    - [x] Auto-generación desde Venta Directa
    - [x] Auto-generación desde OT (al pasar a DELIVERED)
    - [x] Auto-generación desde Nota de Crédito
    - [x] Desglose impositivo inicial (IVA 21% auto-calculado)
    - [ ] Desglose impositivo detallado (por item, requiere migración)
- [ ] Generación de PDFs de pre-facturas con leyenda obligatoria.
- [x] Configuración fiscal en settings (CUIT, Punto de Venta, Certificados).
- [ ] Integración con AFIP (WSFE).

## ✅ DONE
- [x] 2025-05-21 — Estructura inicial de comprobantes y enlace con ventas directas.
- [x] 2025-05-22 — Integración de pre-facturas en OTs y Notas de Crédito, y visualización de advertencia fiscal.
- [x] 2025-05-24 — Configuración fiscal (AFIP) en el panel de administración (PR #X).

## 🧠 LEARNINGS
- **Desglose impositivo:** Para comprobantes tipo B (consumidor final), aunque el total sea lo que ve el cliente, el sistema debe registrar el neto y el IVA por separado para futuros reportes fiscales (Libro IVA Digital). Se implementó un cálculo automático del 21% para pre-facturas.
- **Esquema:** Se verificó que `work_order.invoiceId` ya existe en el esquema de Prisma, permitiendo la vinculación directa sin migraciones adicionales en este paso.
- **Configuración Tipada:** Al manejar booleanos en `settingsService`, es crítico asegurar la conversión de tipos en la API, ya que los valores de base de datos pueden recuperarse como strings (ej: "true") que fallan comparaciones estrictas con literales booleanos.
- **Componentes Custom:** Se optó por una implementación local del componente `Switch` para evitar conflictos de importación interna con Radix-UI detectados durante la revisión de código.

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
