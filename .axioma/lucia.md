## 📋 BACKLOG
- [ ] Implementar búsqueda por patente en el listado de clientes
- [ ] Agregar validación de CUIT en tiempo real en el formulario de clientes
- [ ] Mejorar la visualización de archivos adjuntos en la ficha del vehículo

## ✅ DONE
- [x] 2025-07-24 — Estandarización de UI/UX, accesibilidad y precisión financiera (PR #pending)
  - Actualización de `formatARS` para soportar decimales.
  - Estandarización de tipografía monetaria (`font-mono font-semibold`).
  - Mejora de accesibilidad en `CustomerForm` y `VehicleForm` (IDs, labels, ARIA).
  - Implementación del "Branded Container Pattern" para vehículos en la ficha del cliente.
  - Integración de `relativeTime` en el reporte de deudores.

## 🧠 LEARNINGS
## 2025-07-24 - Estandarización de Datos Financieros
**Learning:** La consistencia en la tipografía (`font-mono`) y el formato de moneda es crítica para la legibilidad en módulos contables. El uso de `formatARS` centralizado evita discrepancias de redondeo.
**Action:** Usar siempre `formatARS` y clases de ancho fijo para valores monetarios.

## 2025-07-24 - Accesibilidad en Formularios Dinámicos
**Learning:** En formularios que se usan tanto en creación como en edición, asegurar que los `id` sean únicos y los `aria-label` descriptivos mejora significativamente la experiencia con lectores de pantalla.
**Action:** Mapear siempre `Label` con `htmlFor` apuntando a `id` explícitos.
