# 📓 Journal — Sofía 🌐

## 📋 BACKLOG
- [ ] Implementar un mapa interactivo (Google Maps) en la página de Contacto.
- [ ] Agregar una sección de Testimonios/Reseñas de clientes en la Home.
- [ ] Crear un botón flotante de WhatsApp persistente en todas las páginas públicas.
- [ ] Mejorar la visualización de detalles de productos (modal o página dedicada).
- [ ] Implementar un sistema de filtros por categoría en la página de Productos.

## ✅ DONE
- [x] 2026-07-04 — Centralización de configuración pública y mejora de conversión (PR #sofia/public/conversion-boost)

## 🧠 LEARNINGS
## 2026-07-04 - Centralización y Conversión WhatsApp
**Learning:** Centralizar la configuración de contacto (WhatsApp, RRSS, dirección) facilita el mantenimiento y asegura consistencia en toda la web pública. Integrar el formulario de contacto directamente con WhatsApp aumenta la tasa de respuesta inmediata para negocios de servicios locales.
**Action:** Mantener `lib/config/public-site.ts` como fuente de verdad para toda la UI pública y seguir el patrón de redirección con contexto (nombre/email) para otros puntos de contacto.
