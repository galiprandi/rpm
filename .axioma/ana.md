# 📓 Journal — Ana 🧾

## 📋 BACKLOG
- [ ] Implementación de Fase 1: Cimientos (Esquema, Servicio, Admin Básico, Auto-generación)
- [ ] Generación de PDFs de pre-facturas con leyenda obligatoria.
- [ ] Configuración fiscal en settings (CUIT, Punto de Venta, Certificados).
- [ ] Integración con AFIP (WSFE).

## ✅ DONE
- [ ] _Sin actividad registrada aún_

## 🧠 LEARNINGS
_Sin learnings registrados._

---

## 🛠️ PROPUESTA DE CAMBIO DE SCHEMA
Para cumplir con la spec de AFIP, se propone extender el modelo `invoice`:

```prisma
model invoice {
  // ... campos existentes ...
  customerDoc     String?                 // CUIT/DNI del cliente al momento de emisión
  customerDocType String?                 // 'CUIT' | 'DNI' | 'SIN_DOC'
  iva21           Decimal?     @db.Decimal(10, 2)    // IVA 21%
  iva105          Decimal?     @db.Decimal(10, 2)    // IVA 10.5%
  exemptions      Json?                  // Detalle de exentos si aplica
  perceptions     Json?                  // Percepciones (futuro)

  // Nuevos índices
  @@index([type])
  @@index([issuedAt])
}
```

**Justificación:** Estos campos son necesarios para el desglose impositivo requerido por AFIP y para la correcta identificación fiscal del cliente al momento de la emisión, independientemente de si el cliente cambia sus datos luego.
